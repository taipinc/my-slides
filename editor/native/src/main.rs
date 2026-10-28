use gpui_kit::base::Disableable;
use gpui_kit::component::{
    ActiveTheme, Theme, ThemeMode,
    button::{Button, ButtonVariants},
    checkbox::Checkbox,
    input::{Input, InputEvent, InputState, Textarea},
};
use gpui_kit::*;
use gpui_wry::WebView;
use raw_window_handle::HasWindowHandle;
use serde::Deserialize;
use serde_json::Value;
use serde_json::json;
mod inspector;
use inspector::{Draft, Inspector};
actions!(slide_workspace, [SaveSlide]);
use std::{
    collections::{BTreeMap, HashMap},
    fs,
    io::{self, BufRead, Write},
    sync::mpsc,
    time::{Duration, Instant},
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Project {
    version: u32,
    deck: Deck,
    #[serde(default)]
    library: Vec<Deck>,
    #[serde(default)]
    show_library: bool,
    origin: String,
    route: String,
    initial_slide: usize,
    slides: Vec<Slide>,
    revision: String,
    image_directory: String,
    can_undo: bool,
    can_redo: bool,
    layouts: Vec<Layout>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Layout {
    id: String,
    label: String,
    editor: Option<Value>,
    #[serde(default)]
    metadata_error: bool,
}

#[derive(Clone, Deserialize)]
struct Deck {
    #[serde(default)]
    path: String,
    title: String,
    course: String,
    semester: String,
}

#[derive(Clone, Deserialize)]
struct Slide {
    number: usize,
    title: String,
    layout: String,
    content: String,
    note: String,
    frontmatter: Value,
    editor: Option<Value>,
    editable: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackendReply {
    id: u64,
    ok: bool,
    message: String,
    #[serde(default)]
    project: Option<Project>,
    #[serde(default)]
    library: Option<Vec<Deck>>,
    #[serde(default)]
    slides: Vec<Slide>,
    #[serde(default)]
    revision: String,
    #[serde(default)]
    can_undo: bool,
    #[serde(default)]
    can_redo: bool,
    #[serde(default)]
    layouts: Vec<Layout>,
}

#[derive(Deserialize)]
struct PreviewMessage {
    #[serde(rename = "type")]
    kind: String,
    #[serde(default)]
    origin: String,
    slide: usize,
    width: u32,
    height: u32,
}

struct Workspace {
    project: Project,
    selected: usize,
    webview: Option<Entity<WebView>>,
    inspector: Inspector,
    drafts: HashMap<usize, Draft>,
    busy: bool,
    request_id: u64,
    pending: String,
    saving_slide: usize,
    edit_status: String,
    confirm: Option<String>,
    layout_picker: bool,
    library_open: bool,
    library_query: Entity<InputState>,
    _library_subscription: Subscription,
    preview_sender: mpsc::Sender<PreviewMessage>,
    status: String,
    failed: bool,
    help_open: bool,
    started: Instant,
    rendered: bool,
    _poll: Task<()>,
}

impl Workspace {
    fn new(project: Project, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let selected = project.initial_slide - 1;
        let inspector = Inspector::new(
            &project.slides[selected],
            Draft::from_slide(&project.slides[selected]),
            &project.layouts,
            window,
            cx,
        );
        let (reply_sender, reply_receiver) = mpsc::channel::<BackendReply>();
        std::thread::spawn(move || {
            for line in io::stdin().lock().lines().map_while(Result::ok) {
                if let Ok(reply) = serde_json::from_str::<BackendReply>(&line) {
                    if reply_sender.send(reply).is_err() {
                        break;
                    }
                }
            }
        });
        let (sender, receiver) = mpsc::channel::<PreviewMessage>();
        let (webview, status, failed) =
            Self::create_webview(project.origin.clone(), sender.clone(), window, cx);
        let library_open = project.show_library;
        let library_query = cx.new(|cx| {
            InputState::new(window, cx).placeholder("Search title, course, semester or path")
        });
        let library_subscription = cx.subscribe(&library_query, |_, _, event: &InputEvent, cx| {
            if matches!(event, InputEvent::Change) {
                cx.notify();
            }
        });
        let poll = cx.spawn_in(window, async move |this, cx| {
            loop {
                cx.background_executor().timer(Duration::from_millis(150)).await;
                if this.update_in(cx, |this, window, cx| {
                    for reply in reply_receiver.try_iter() { this.apply_reply(reply, window, cx); }
                    for message in receiver.try_iter() {
                        if message.origin != this.project.origin || message.slide == 0 || message.slide > this.project.slides.len() { continue; }
                        if message.kind == "rendered" && message.width > 0 && message.height > 0 {
                            this.rendered = true;
                            this.failed = false;
                            if this.selected != message.slide - 1 {
                                this.remember_draft(cx);
                                this.selected = message.slide - 1;
                                this.load_inspector(window, cx);
                            }
                            this.status = format!("Slide {} · {} × {}", message.slide, message.width, message.height);
                            eprintln!("Preview rendered: {}", this.status);
                        } else if message.kind == "error" {
                            this.failed = true;
                            this.status = "Slidev reported a rendering error. Check the terminal, then Retry.".into();
                        }
                        if let Some(view) = &this.webview {
                            view.update(cx, |view, _| if this.failed || this.help_open || this.confirm.is_some() || this.layout_picker || this.library_open { view.hide() } else { view.show() });
                        }
                        cx.notify();
                    }
                    if !this.rendered && !this.failed && this.started.elapsed() > Duration::from_secs(45) {
                        this.failed = true;
                        this.status = "Preview timed out. Check the terminal, then Retry.".into();
                        if let Some(view) = &this.webview { view.update(cx, |view, _| view.hide()); }
                        cx.notify();
                    }
                }).is_err() { break; }
            }
        });
        let this = Self {
            project,
            selected,
            webview,
            inspector,
            drafts: HashMap::new(),
            busy: false,
            request_id: 0,
            pending: String::new(),
            saving_slide: selected,
            edit_status: "Saved".into(),
            confirm: None,
            layout_picker: false,
            library_open,
            library_query,
            _library_subscription: library_subscription,
            preview_sender: sender,
            status,
            failed,
            help_open: false,
            started: Instant::now(),
            rendered: false,
            _poll: poll,
        };
        if let Some(view) = &this.webview {
            let url = this.slide_url(selected + 1);
            view.update(cx, |view, _| {
                if let Err(error) = view.raw().load_url(&url) {
                    eprintln!("Navigation failed: {error}");
                }
                if library_open {
                    view.hide();
                }
            });
        }
        this
    }

    fn create_webview(
        origin: String,
        sender: mpsc::Sender<PreviewMessage>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> (Option<Entity<WebView>>, String, bool) {
        let trusted_origin = origin.clone();
        let builder = wry::WebViewBuilder::new()
            .with_initialization_script(include_str!("preview.js"))
            .with_navigation_handler(move |url| url.starts_with(&format!("{origin}/")))
            .with_new_window_req_handler(|_, _| wry::NewWindowResponse::Deny)
            .with_download_started_handler(|_, _| false)
            .with_ipc_handler(move |request| {
                if request.body().len() > 1024
                    || !request
                        .uri()
                        .to_string()
                        .starts_with(&format!("{trusted_origin}/"))
                {
                    return;
                }
                if let Ok(mut message) = serde_json::from_str::<PreviewMessage>(request.body()) {
                    message.origin = trusted_origin.clone();
                    let _ = sender.send(message);
                }
            });
        let native = window
            .window_handle()
            .map_err(|e| e.to_string())
            .and_then(|handle| builder.build_as_child(&handle).map_err(|e| e.to_string()));
        match native {
            Ok(native) => (
                Some(cx.new(|cx| WebView::new(native, window, cx))),
                "Loading Slidev…".into(),
                false,
            ),
            Err(error) => (None, format!("Cannot create preview: {error}"), true),
        }
    }

    fn slide_url(&self, number: usize) -> String {
        if self.project.route == "hash" {
            format!("{}/?embedded=true#/{number}", self.project.origin)
        } else {
            format!("{}/{number}?embedded=true", self.project.origin)
        }
    }

    fn reset_content(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.drafts.remove(&self.selected);
        self.inspector = Inspector::new(
            &self.project.slides[self.selected],
            Draft::from_slide(&self.project.slides[self.selected]),
            &self.project.layouts,
            window,
            cx,
        );
        cx.notify();
    }

    fn dirty(&self, cx: &App) -> bool {
        self.inspector.draft(cx) != Draft::from_slide(&self.project.slides[self.selected])
    }

    fn metadata_valid(&self) -> bool {
        !self
            .project
            .layouts
            .iter()
            .any(|layout| layout.id == self.inspector.layout && layout.metadata_error)
    }

    fn any_dirty(&self, cx: &App) -> bool {
        self.dirty(cx)
            || self.drafts.iter().any(|(index, draft)| {
                *index != self.selected && *draft != Draft::from_slide(&self.project.slides[*index])
            })
    }

    fn remember_draft(&mut self, cx: &App) {
        let draft = self.inspector.draft(cx);
        if draft == Draft::from_slide(&self.project.slides[self.selected]) {
            self.drafts.remove(&self.selected);
        } else {
            self.drafts.insert(self.selected, draft);
        }
    }

    fn load_inspector(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let slide = &self.project.slides[self.selected];
        let draft = self
            .drafts
            .get(&self.selected)
            .cloned()
            .unwrap_or_else(|| Draft::from_slide(slide));
        self.inspector = Inspector::new(slide, draft, &self.project.layouts, window, cx);
    }

    fn send(&mut self, action: &str, mut request: Value, cx: &mut Context<Self>) {
        if self.busy {
            return;
        }
        self.request_id += 1;
        request["id"] = json!(self.request_id);
        request["action"] = json!(action);
        request["revision"] = json!(self.project.revision);
        let result = writeln!(io::stdout(), "{request}").and_then(|_| io::stdout().flush());
        if let Err(error) = result {
            self.edit_status = format!("Editor connection failed: {error}");
        } else {
            self.busy = true;
            self.pending = action.into();
            self.saving_slide = self.selected;
            self.edit_status = "Working…".into();
        }
        cx.notify();
    }

    fn save(&mut self, cx: &mut Context<Self>) {
        if !self.metadata_valid() {
            self.edit_status =
                "Fix this layout’s editor metadata before saving. Your draft is retained.".into();
            cx.notify();
            return;
        }
        self.remember_draft(cx);
        match self.inspector.values(cx) {
            Ok(fields) => {
                let draft = self.inspector.draft(cx);
                self.send("save", json!({ "slide": self.selected + 1, "layout": draft.layout, "content": draft.content, "note": draft.note, "fields": fields }), cx);
            }
            Err(error) => {
                self.edit_status = error;
                cx.notify();
            }
        }
    }

    fn apply_reply(&mut self, reply: BackendReply, window: &mut Window, cx: &mut Context<Self>) {
        if reply.id == 0 && reply.ok && !reply.layouts.is_empty() {
            self.remember_draft(cx);
            self.project.layouts = reply.layouts;
            for slide in &mut self.project.slides {
                slide.editor = self
                    .project
                    .layouts
                    .iter()
                    .find(|layout| layout.id == slide.layout)
                    .and_then(|layout| layout.editor.clone());
            }
            self.load_inspector(window, cx);
            self.edit_status = reply.message;
            cx.notify();
            return;
        }
        if reply.id != self.request_id {
            return;
        }
        self.busy = false;
        self.edit_status = reply.message;
        if reply.ok {
            if let Some(library) = reply.library {
                self.project.library = library;
            }
            if let Some(project) = reply.project {
                if project.slides.is_empty()
                    || project.initial_slide == 0
                    || project.initial_slide > project.slides.len()
                {
                    self.edit_status = "Cannot open an empty presentation".into();
                    cx.notify();
                    return;
                }
                if let Some(view) = self.webview.take() {
                    view.update(cx, |view, _| view.hide());
                }
                self.project = project;
                self.selected = self.project.initial_slide - 1;
                self.drafts.clear();
                self.layout_picker = false;
                self.library_open = false;
                self.help_open = false;
                self.confirm = None;
                self.load_inspector(window, cx);
                let (view, status, failed) = Self::create_webview(
                    self.project.origin.clone(),
                    self.preview_sender.clone(),
                    window,
                    cx,
                );
                self.webview = view;
                self.status = status;
                self.failed = failed;
                self.rendered = false;
                self.started = Instant::now();
                if let Some(view) = &self.webview {
                    let url = self.slide_url(self.selected + 1);
                    view.update(cx, |view, _| {
                        if let Err(error) = view.raw().load_url(&url) {
                            eprintln!("Navigation failed: {error}");
                        }
                    });
                }
            }
        }
        if reply.ok && !reply.slides.is_empty() {
            self.remember_draft(cx);
            if self.pending == "save" {
                self.drafts.remove(&self.saving_slide);
            } else {
                self.drafts.clear();
            }
            self.project.slides = reply.slides;
            self.project.layouts = reply.layouts;
            self.project.revision = reply.revision;
            self.project.can_undo = reply.can_undo;
            self.project.can_redo = reply.can_redo;
            self.selected = self.selected.min(self.project.slides.len() - 1);
            self.load_inspector(window, cx);
        }
        cx.notify();
    }

    fn choose_layout(&mut self, id: String, window: &mut Window, cx: &mut Context<Self>) {
        let mut draft = self.inspector.draft(cx);
        draft.layout = id;
        self.drafts.insert(self.selected, draft.clone());
        self.inspector = Inspector::new(
            &self.project.slides[self.selected],
            draft,
            &self.project.layouts,
            window,
            cx,
        );
        self.layout_picker = false;
        self.help_open = false;
        if !self.failed {
            if let Some(view) = &self.webview {
                view.update(cx, |view, _| view.show());
            }
        }
        cx.notify();
    }

    fn confirm_action(&mut self, action: &str, cx: &mut Context<Self>) {
        self.layout_picker = false;
        self.library_open = false;
        self.confirm = Some(action.into());
        if let Some(view) = &self.webview {
            view.update(cx, |view, _| view.hide());
        }
        cx.notify();
    }

    fn choose_asset(&mut self, index: usize, window: &mut Window, cx: &mut Context<Self>) {
        let prompt = cx.prompt_for_paths(PathPromptOptions {
            files: true,
            directories: false,
            multiple: false,
            prompt: Some("Choose an existing file from this deck’s images folder".into()),
        });
        let key = self.inspector.fields[index].key.clone();
        let selected = self.selected;
        let directory = std::path::PathBuf::from(&self.project.image_directory);
        cx.spawn_in(window, async move |this, cx| {
            if let Ok(Ok(Some(paths))) = prompt.await {
                if let Some(path) = paths.first() {
                    let relative = path.canonicalize().ok().and_then(|path| path.strip_prefix(&directory).ok().map(std::path::Path::to_path_buf));
                    let _ = this.update_in(cx, |this, window, cx| {
                        if this.selected != selected { return; }
                        if let Some(relative) = relative {
                            if let Some(input) = this.inspector.fields.iter().find(|field| field.key == key).and_then(|field| field.input.as_ref()) {
                                input.update(cx, |state, cx| state.set_value(format!("./images/{}", relative.display()), window, cx));
                            }
                        } else { this.edit_status = "Choose a file from this presentation’s images folder; asset import comes later.".into(); }
                        cx.notify();
                    });
                }
            }
        }).detach();
    }

    fn select(&mut self, index: usize, window: &mut Window, cx: &mut Context<Self>) {
        if self.busy || self.confirm.is_some() || self.layout_picker || self.library_open {
            return;
        }
        if index == self.selected {
            self.help_open = false;
            if !self.failed {
                if let Some(view) = &self.webview {
                    view.update(cx, |view, _| view.show());
                }
            }
            cx.notify();
            return;
        }
        self.remember_draft(cx);
        self.selected = index;
        self.help_open = false;
        self.load_inspector(window, cx);
        self.started = Instant::now();
        self.rendered = false;
        self.failed = false;
        self.status = "Loading Slidev…".into();
        // Use Slidev's embedded-control API and its client-side router.
        // Full page reloads are reserved for the explicit Retry action.
        let script = format!(
            "window.postMessage({{target:'slidev',type:'navigate',no:{},clicks:0}},location.origin);",
            index + 1
        );
        if let Some(view) = &self.webview {
            view.update(cx, |view, _| {
                view.show();
                if let Err(error) = view.raw().evaluate_script(&script) {
                    eprintln!("Navigation failed: {error}");
                }
            });
        }
        cx.notify();
    }

    fn retry(&mut self, _window: &mut Window, cx: &mut Context<Self>) {
        self.remember_draft(cx);
        self.help_open = false;
        self.started = Instant::now();
        self.rendered = false;
        self.failed = false;
        self.status = "Loading Slidev…".into();
        if let Some(view) = &self.webview {
            let result = view.update(cx, |view, _| {
                view.show();
                view.raw().reload()
            });
            if let Err(error) = result {
                self.failed = true;
                self.status = format!("Cannot reload preview: {error}");
                view.update(cx, |view, _| view.hide());
            }
        }
        cx.notify();
    }
}

impl Render for Workspace {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let slide = &self.project.slides[self.selected];
        let blocked =
            self.busy || self.confirm.is_some() || self.layout_picker || self.library_open;
        let border = cx.theme().border;
        let muted = rgb(0x747474);
        let mut navigation = div()
            .id("slide-list")
            .flex_1()
            .min_h_0()
            .overflow_y_scroll()
            .p_3()
            .flex()
            .flex_col()
            .gap_2();
        for (index, item) in self.project.slides.iter().enumerate() {
            navigation = navigation.child(
                div()
                    .id(index)
                    .role(Role::Button)
                    .aria_label(format!("Slide {}: {}", item.number, item.title))
                    .p_3()
                    .rounded_lg()
                    .border_1()
                    .border_color(if index == self.selected {
                        rgb(0x9b91cf).into()
                    } else {
                        border
                    })
                    .bg(if index == self.selected {
                        rgb(0xf0edf9)
                    } else {
                        rgb(0xffffff)
                    })
                    .cursor_pointer()
                    .flex()
                    .flex_col()
                    .gap_2()
                    .child(
                        div()
                            .text_xs()
                            .text_color(muted)
                            .child(format!("{:02} · {}", item.number, item.layout)),
                    )
                    .child(div().text_sm().child(item.title.clone()))
                    .on_click(
                        cx.listener(move |this, _, window, cx| this.select(index, window, cx)),
                    ),
            );
        }

        let mut inspector = div()
            .w(px(300.))
            .flex_shrink_0()
            .border_l_1()
            .border_color(border)
            .p_4()
            .id("inspector")
            .overflow_y_scroll()
            .flex()
            .flex_col()
            .gap_3()
            .child(div().text_sm().child(format!("Slide {}", slide.number)))
            .child(div().text_xs().text_color(muted).child("LAYOUT"))
            .child(
                Button::new("choose-layout")
                    .label(
                        self.project
                            .layouts
                            .iter()
                            .find(|layout| layout.id == self.inspector.layout)
                            .map(|layout| layout.label.clone())
                            .unwrap_or_else(|| self.inspector.layout.clone()),
                    )
                    .disabled(!slide.editable || blocked)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.layout_picker = true;
                        this.help_open = false;
                        if let Some(view) = &this.webview {
                            view.update(cx, |view, _| view.hide());
                        }
                        cx.notify();
                    })),
            );
        let editable = slide.editable && !blocked;
        for (index, field) in self.inspector.fields.iter().enumerate() {
            let mut row = div()
                .flex()
                .flex_col()
                .gap_1()
                .child(div().text_xs().text_color(muted).child(field.label.clone()));
            if field.kind == "boolean" {
                row = row.child(
                    Checkbox::new(SharedString::from(field.key.clone()))
                        .checked(field.value.as_bool().unwrap_or(false))
                        .disabled(!editable)
                        .on_change(cx.listener(move |this, checked, _, cx| {
                            this.inspector.fields[index].value = json!(*checked);
                            cx.notify();
                        })),
                );
            } else if field.kind == "select" {
                let mut choices = div().flex().flex_wrap().gap_1();
                for (choice_index, option) in field.options.iter().enumerate() {
                    let value = option.clone();
                    choices = choices.child(
                        Button::new(SharedString::from(format!("{}-{choice_index}", field.key)))
                            .ghost()
                            .label(if field.value.as_str() == Some(option) {
                                format!("✓ {option}")
                            } else {
                                option.clone()
                            })
                            .disabled(!editable)
                            .on_click(cx.listener(move |this, _, _, cx| {
                                this.inspector.fields[index].value = json!(value.clone());
                                cx.notify();
                            })),
                    );
                }
                row = row.child(choices);
            } else if let Some(input) = &field.input {
                row = row.child(Input::new(input).disabled(!editable));
                if field.kind == "asset" {
                    row = row.child(
                        Button::new(SharedString::from(format!("choose-{}", field.key)))
                            .ghost()
                            .label("Choose existing file…")
                            .disabled(!editable || self.project.image_directory.is_empty())
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.choose_asset(index, window, cx)
                            })),
                    );
                }
            }
            inspector = inspector.child(row);
        }
        inspector = inspector
            .child(div().text_xs().child(self.edit_status.clone()))
            .child(div().text_sm().child("Content"))
            .child(Textarea::new(&self.inspector.content).disabled(!editable))
            .child(div().text_sm().child("Speaker notes"))
            .child(Textarea::new(&self.inspector.notes).disabled(!editable))
            .child(div().flex().gap_2()
                .child(Button::new("save").primary().label("Save").disabled(!editable || !self.dirty(cx) || !self.metadata_valid())
                    .on_click(cx.listener(|this, _, _, cx| this.save(cx))))
                .child(Button::new("reset").ghost().label("Discard draft").disabled(blocked || !self.dirty(cx))
                    .on_click(cx.listener(|this, _, window, cx| this.reset_content(window, cx)))))
            .child(div().text_xs().text_color(muted).child(if slide.editable {
                "Changes appear in the preview after Save. Cmd+Z edits text; Undo save restores the previous saved version."
            } else { "Imported slides are read-only in this milestone." }));

        let mut preview = div()
            .flex_1()
            .min_w_0()
            .min_h_0()
            .relative()
            .bg(rgb(0xf4f3f5));
        if self.layout_picker {
            let mut choices = div()
                .id("layout-choices")
                .max_h(px(560.))
                .overflow_y_scroll()
                .flex()
                .flex_col()
                .gap_2();
            for layout in &self.project.layouts {
                let id = layout.id.clone();
                choices = choices.child(
                    Button::new(SharedString::from(format!("layout-{}", layout.id)))
                        .ghost()
                        .label(if layout.id == self.inspector.layout {
                            format!("✓ {}", layout.label)
                        } else {
                            layout.label.clone()
                        })
                        .on_click(cx.listener(move |this, _, window, cx| {
                            this.choose_layout(id.clone(), window, cx)
                        })),
                );
            }
            preview = preview.flex().items_center().justify_center().child(
                div()
                    .p_5()
                    .w(px(420.))
                    .rounded_lg()
                    .bg(rgb(0xffffff))
                    .flex()
                    .flex_col()
                    .gap_3()
                    .child("Choose a layout")
                    .child(div().text_xs().text_color(muted).child(
                        "Content and notes stay in your draft. The preview changes after Save.",
                    ))
                    .child(choices)
                    .child(
                        Button::new("cancel-layout")
                            .label("Cancel")
                            .on_click(cx.listener(|this, _, _, cx| {
                                this.layout_picker = false;
                                if !this.failed {
                                    if let Some(view) = &this.webview {
                                        view.update(cx, |view, _| view.show());
                                    }
                                }
                                cx.notify();
                            })),
                    ),
            );
        } else if let Some(action) = self.confirm.clone() {
            let closing = action == "close";
            let opening = action.strip_prefix("open:").map(str::to_string);
            preview = preview.flex().items_center().justify_center().child(
                div().p_6().max_w(px(440.)).rounded_lg().bg(rgb(0xffffff)).flex().flex_col().gap_3()
                    .child(if closing { "Close without saving?" } else if opening.is_some() { "Open another presentation?" } else { "Reload from disk?" })
                    .child(div().text_sm().child(if closing {
                        "Unsaved drafts will be discarded. Saved changes stay on disk."
                    } else if opening.is_some() { "Opening another presentation discards unsaved drafts. Saved files stay on disk." } else { "Reloading discards unsaved drafts and clears undo history so you can review the current files." }))
                    .child(Button::new("cancel-confirm").label("Keep editing").on_click(cx.listener(|this, _, _, cx| {
                        this.confirm = None;
                        if !this.failed && !this.help_open { if let Some(view) = &this.webview { view.update(cx, |view, _| view.show()); } }
                        cx.notify();
                    })))
                    .child(Button::new("confirm").label(if closing { "Discard drafts and close" } else if opening.is_some() { "Discard drafts and open" } else { "Discard drafts and reload" })
                        .on_click(cx.listener(move |this, _, window, cx| {
                            this.confirm = None;
                            if closing { this.drafts.clear(); window.remove_window(); }
                            else if let Some(path) = &opening {
                                this.library_open = true;
                                this.send("open", json!({ "path": path }), cx);
                            } else {
                                this.help_open = false;
                                this.send("reload", json!({}), cx);
                                if !this.failed { if let Some(view) = &this.webview { view.update(cx, |view, _| view.show()); } }
                            }
                        }))),
            );
        } else if self.library_open {
            let query = self
                .library_query
                .read(cx)
                .value()
                .to_string()
                .to_lowercase();
            let mut groups: BTreeMap<(String, String), Vec<Deck>> = BTreeMap::new();
            for deck in &self.project.library {
                if format!(
                    "{} {} {} {}",
                    deck.title, deck.course, deck.semester, deck.path
                )
                .to_lowercase()
                .contains(&query)
                {
                    groups
                        .entry((deck.course.clone(), deck.semester.clone()))
                        .or_default()
                        .push(deck.clone());
                }
            }
            let count: usize = groups.values().map(Vec::len).sum();
            let mut list = div()
                .id("deck-library-list")
                .flex_1()
                .min_h_0()
                .overflow_y_scroll()
                .flex()
                .flex_col()
                .gap_3();
            for ((course, semester), decks) in groups {
                list = list.child(div().text_sm().child(format!("{course} · {semester}")));
                for deck in decks {
                    let path = deck.path.clone();
                    let current = path == self.project.deck.path;
                    list = list.child(
                        div()
                            .p_3()
                            .rounded_lg()
                            .border_1()
                            .border_color(border)
                            .flex()
                            .flex_col()
                            .gap_1()
                            .child(
                                Button::new(SharedString::from(format!("open-{}", path)))
                                    .ghost()
                                    .label(if current {
                                        format!("{} · Open", deck.title)
                                    } else {
                                        deck.title.clone()
                                    })
                                    .disabled(self.busy)
                                    .on_click(cx.listener(move |this, _, _, cx| {
                                        if path == this.project.deck.path {
                                            this.library_open = false;
                                            if !this.failed {
                                                if let Some(view) = &this.webview {
                                                    view.update(cx, |view, _| view.show());
                                                }
                                            }
                                        } else if this.any_dirty(cx) {
                                            this.confirm_action(&format!("open:{path}"), cx);
                                        } else {
                                            this.send("open", json!({ "path": path }), cx);
                                        }
                                        cx.notify();
                                    })),
                            )
                            .child(div().text_xs().text_color(muted).child(deck.path)),
                    );
                }
            }
            if count == 0 {
                list = list.child("No presentations match this search.");
            }
            preview = preview
                .p_6()
                .flex()
                .flex_col()
                .gap_3()
                .child(div().text_lg().child("Presentations"))
                .child(Input::new(&self.library_query).disabled(self.busy))
                .child(div().text_xs().text_color(muted).child(format!(
                    "{count} presentations · grouped by course and semester"
                )))
                .child(list)
                .child(div().text_xs().child(self.edit_status.clone()))
                .child(
                    Button::new("close-library")
                        .label("Back to presentation")
                        .disabled(self.busy)
                        .on_click(cx.listener(|this, _, _, cx| {
                            this.library_open = false;
                            if !this.failed {
                                if let Some(view) = &this.webview {
                                    view.update(cx, |view, _| view.show());
                                }
                            }
                            cx.notify();
                        })),
                );
        } else if self.help_open {
            preview = preview.flex().items_center().justify_center().child(
                div().p_6().max_w(px(430.)).rounded_lg().bg(rgb(0xffffff)).flex().flex_col().gap_3()
                    .child("Native preview prototype")
                    .child(div().text_sm().child("The preview uses the real Slidev renderer. Select slides on the left. Edit content and layout fields in the inspector. Drafts survive navigation. Save writes the selected slide; Undo save and Redo save restore saved versions."))
                    .child(div().text_sm().child("For dialogs, this prototype hides the native WebView before displaying application content in its place."))
                    .child(Button::new("close-help").label("Back to preview").on_click(cx.listener(|this, _, _, cx| {
                        this.help_open = false;
                        if !this.failed { if let Some(view) = &this.webview { view.update(cx, |view, _| view.show()); } }
                        cx.notify();
                    }))),
            );
        } else if self.failed {
            preview = preview
                .flex()
                .items_center()
                .justify_center()
                .child(div().max_w(px(400.)).p_6().child(self.status.clone()));
        } else if let Some(view) = &self.webview {
            preview = preview.child(view.clone());
        }

        div()
            .id("workspace")
            .role(Role::Group)
            .aria_label("Slide editor")
            .on_action(cx.listener(|this, _: &SaveSlide, _, cx| {
                if !this.busy
                    && this.confirm.is_none()
                    && !this.layout_picker
                    && !this.library_open
                    && this.project.slides[this.selected].editable
                    && this.dirty(cx)
                {
                    this.save(cx);
                }
            }))
            .size_full()
            .flex()
            .flex_col()
            .bg(rgb(0xffffff))
            .text_color(rgb(0x262528))
            .text_size(px(13.))
            .child(
                div()
                    .h(px(52.))
                    .flex_shrink_0()
                    .px_4()
                    .border_b_1()
                    .border_color(border)
                    .flex()
                    .items_center()
                    .justify_between()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .child(self.project.deck.title.clone())
                            .child(div().text_xs().text_color(muted).child(format!(
                                "{} · {}",
                                self.project.deck.course, self.project.deck.semester
                            ))),
                    )
                    .child(
                        div()
                            .flex()
                            .gap_2()
                            .child(
                                Button::new("library")
                                    .ghost()
                                    .label("Library")
                                    .disabled(blocked)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.library_open = true;
                                        this.help_open = false;
                                        if let Some(view) = &this.webview {
                                            view.update(cx, |view, _| view.hide());
                                        }
                                        this.send("library", json!({}), cx);
                                    })),
                            )
                            .child(
                                Button::new("save-toolbar")
                                    .primary()
                                    .label("Save")
                                    .disabled(
                                        blocked
                                            || !slide.editable
                                            || !self.dirty(cx)
                                            || !self.metadata_valid(),
                                    )
                                    .on_click(cx.listener(|this, _, _, cx| this.save(cx))),
                            )
                            .child(
                                Button::new("undo-save")
                                    .ghost()
                                    .label("Undo save")
                                    .disabled(
                                        blocked || self.any_dirty(cx) || !self.project.can_undo,
                                    )
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.send("undo", json!({}), cx)
                                    })),
                            )
                            .child(
                                Button::new("redo-save")
                                    .ghost()
                                    .label("Redo save")
                                    .disabled(
                                        blocked || self.any_dirty(cx) || !self.project.can_redo,
                                    )
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.send("redo", json!({}), cx)
                                    })),
                            )
                            .child(
                                Button::new("reload-deck")
                                    .ghost()
                                    .label("Reload from disk")
                                    .disabled(blocked)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.confirm_action("reload", cx)
                                    })),
                            )
                            .child(
                                Button::new("retry")
                                    .ghost()
                                    .label("Retry preview")
                                    .disabled(blocked || self.webview.is_none())
                                    .on_click(
                                        cx.listener(|this, _, window, cx| this.retry(window, cx)),
                                    ),
                            )
                            .child(
                                Button::new("help")
                                    .ghost()
                                    .label("About prototype")
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.help_open = !this.help_open;
                                        if let Some(view) = &this.webview {
                                            view.update(cx, |view, _| {
                                                if this.help_open
                                                    || this.failed
                                                    || this.confirm.is_some()
                                                {
                                                    view.hide()
                                                } else {
                                                    view.show()
                                                }
                                            });
                                        }
                                        cx.notify();
                                    })),
                            ),
                    ),
            )
            .child(
                div()
                    .flex()
                    .flex_1()
                    .min_h_0()
                    .child(
                        div()
                            .w(px(220.))
                            .flex_shrink_0()
                            .border_r_1()
                            .border_color(border)
                            .flex()
                            .flex_col()
                            .child(
                                div()
                                    .p_4()
                                    .text_xs()
                                    .text_color(muted)
                                    .child(format!("{} SLIDES", self.project.slides.len())),
                            )
                            .child(navigation),
                    )
                    .child(preview)
                    .child(inspector),
            )
            .child(
                div()
                    .h(px(30.))
                    .flex_shrink_0()
                    .px_4()
                    .border_t_1()
                    .border_color(border)
                    .flex()
                    .items_center()
                    .justify_between()
                    .text_xs()
                    .text_color(muted)
                    .child(self.status.clone())
                    .child(if self.any_dirty(cx) {
                        "Unsaved drafts"
                    } else {
                        "Saved"
                    }),
            )
    }
}

fn main() {
    let project = std::env::args()
        .nth(1)
        .ok_or("Expected a project snapshot path")
        .and_then(|path| fs::read_to_string(path).map_err(|_| "Cannot read project snapshot"))
        .and_then(|source| {
            serde_json::from_str::<Project>(&source).map_err(|_| "Invalid project snapshot")
        });
    let project = match project {
        Ok(project)
            if project.version == 1
                && !project.slides.is_empty()
                && project.initial_slide > 0
                && project.initial_slide <= project.slides.len() =>
        {
            project
        }
        _ => {
            eprintln!("Invalid or missing version 1 project snapshot");
            std::process::exit(1);
        }
    };
    application().with_assets(assets::Assets).run(move |cx| {
        init(cx);
        cx.bind_keys([KeyBinding::new("cmd-s", SaveSlide, None)]);
        Theme::change(ThemeMode::Light, None, cx);
        cx.on_window_closed(|cx, _| {
            if cx.windows().is_empty() {
                cx.quit();
            }
        })
        .detach();
        let bounds = Bounds::centered(None, size(px(1440.), px(920.)), cx);
        if let Err(error) = open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                window_min_size: Some(size(px(1000.), px(640.))),
                titlebar: Some(TitlebarOptions {
                    title: Some("Slide Workspace".into()),
                    ..Default::default()
                }),
                ..Default::default()
            },
            cx,
            |window, cx| {
                let workspace = cx.new(|cx| Workspace::new(project, window, cx));
                let weak = workspace.downgrade();
                window.on_window_should_close(cx, move |_, cx| {
                    weak.update(cx, |this, cx| {
                        if this.busy {
                            return false;
                        }
                        if this.any_dirty(cx) {
                            this.confirm_action("close", cx);
                            false
                        } else {
                            true
                        }
                    })
                    .unwrap_or(true)
                });
                workspace
            },
        ) {
            eprintln!("Cannot open native window: {error}");
            cx.quit();
        }
        cx.activate(true);
    });
}
