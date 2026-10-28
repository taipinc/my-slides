use crate::{Layout, Slide, Workspace};
use gpui_kit::component::input::{InputEvent, InputState, TextareaState};
use gpui_kit::*;
use serde_json::{Map, Value};

#[derive(Clone, PartialEq)]
pub struct Draft {
    pub layout: String,
    pub content: String,
    pub note: String,
    pub fields: Map<String, Value>,
}

impl Draft {
    pub fn from_slide(slide: &Slide) -> Self {
        let mut fields = Map::new();
        if let Some(schema) = slide
            .editor
            .as_ref()
            .and_then(|editor| editor["fields"].as_array())
        {
            for field in schema {
                let key = field["key"].as_str().unwrap_or_default();
                let value = slide.frontmatter.get(key).or_else(|| field.get("default"));
                fields.insert(
                    key.to_string(),
                    if field["type"] == "boolean" {
                        Value::Bool(value.and_then(Value::as_bool).unwrap_or(false))
                    } else {
                        Value::String(match value {
                            Some(Value::String(text)) => text.clone(),
                            Some(value) => value.to_string(),
                            None => String::new(),
                        })
                    },
                );
            }
        }
        Self {
            layout: slide.layout.clone(),
            content: slide.content.clone(),
            note: slide.note.clone(),
            fields,
        }
    }
}

pub struct Field {
    pub key: String,
    pub label: String,
    pub kind: String,
    pub options: Vec<String>,
    pub input: Option<Entity<InputState>>,
    pub value: Value,
}

pub struct Inspector {
    pub layout: String,
    pub content: Entity<TextareaState>,
    pub notes: Entity<TextareaState>,
    pub fields: Vec<Field>,
    extras: Map<String, Value>,
    _subscriptions: Vec<Subscription>,
}

impl Inspector {
    pub fn new(
        slide: &Slide,
        draft: Draft,
        layouts: &[Layout],
        window: &mut Window,
        cx: &mut Context<Workspace>,
    ) -> Self {
        let content = cx.new(|cx| {
            TextareaState::new(window, cx)
                .rows(7)
                .default_value(draft.content)
        });
        let notes = cx.new(|cx| {
            TextareaState::new(window, cx)
                .rows(3)
                .default_value(draft.note)
        });
        let mut subscriptions = vec![
            cx.subscribe(&content, |_, _, event: &InputEvent, cx| {
                if matches!(event, InputEvent::Change) {
                    cx.notify();
                }
            }),
            cx.subscribe(&notes, |_, _, event: &InputEvent, cx| {
                if matches!(event, InputEvent::Change) {
                    cx.notify();
                }
            }),
        ];
        let mut fields = Vec::new();
        let editor = layouts
            .iter()
            .find(|layout| layout.id == draft.layout)
            .and_then(|layout| layout.editor.as_ref())
            .or_else(|| {
                if draft.layout == slide.layout {
                    slide.editor.as_ref()
                } else {
                    None
                }
            });
        if let Some(schema) = editor.and_then(|editor| editor["fields"].as_array()) {
            for field in schema {
                let key = field["key"].as_str().unwrap_or_default().to_string();
                let kind = field["type"].as_str().unwrap_or("text").to_string();
                let value = draft.fields.get(&key).cloned().unwrap_or_else(|| {
                    let value = slide.frontmatter.get(&key).or_else(|| field.get("default"));
                    if kind == "boolean" {
                        Value::Bool(value.and_then(Value::as_bool).unwrap_or(false))
                    } else {
                        Value::String(match value {
                            Some(Value::String(text)) => text.clone(),
                            Some(value) => value.to_string(),
                            None => String::new(),
                        })
                    }
                });
                let input = if kind == "boolean" || kind == "select" {
                    None
                } else {
                    let input = cx.new(|cx| {
                        InputState::new(window, cx)
                            .default_value(value.as_str().unwrap_or_default().to_string())
                    });
                    subscriptions.push(cx.subscribe(&input, |_, _, event: &InputEvent, cx| {
                        if matches!(event, InputEvent::Change) {
                            cx.notify();
                        }
                    }));
                    Some(input)
                };
                fields.push(Field {
                    key,
                    label: field["label"].as_str().unwrap_or_default().to_string(),
                    kind,
                    options: field["options"]
                        .as_array()
                        .map(|options| {
                            options
                                .iter()
                                .filter_map(Value::as_str)
                                .map(str::to_string)
                                .collect()
                        })
                        .unwrap_or_default(),
                    input,
                    value,
                });
            }
        }
        Self {
            layout: draft.layout,
            content,
            notes,
            fields,
            extras: draft.fields,
            _subscriptions: subscriptions,
        }
    }

    pub fn draft(&self, cx: &App) -> Draft {
        let mut fields = self.extras.clone();
        for field in &self.fields {
            fields.insert(
                field.key.clone(),
                match &field.input {
                    Some(input) => Value::String(input.read(cx).value().to_string()),
                    None => field.value.clone(),
                },
            );
        }
        Draft {
            layout: self.layout.clone(),
            content: self.content.read(cx).value().to_string(),
            note: self.notes.read(cx).value().to_string(),
            fields,
        }
    }

    pub fn values(&self, cx: &App) -> Result<Value, String> {
        let mut values = self.draft(cx).fields;
        values.retain(|key, _| self.fields.iter().any(|field| &field.key == key));
        for field in &self.fields {
            if field.kind == "number" {
                let number = values[&field.key]
                    .as_str()
                    .unwrap_or_default()
                    .parse::<f64>()
                    .map_err(|_| format!("{} must be a number", field.label))?;
                values.insert(
                    field.key.clone(),
                    serde_json::Number::from_f64(number)
                        .map(Value::Number)
                        .ok_or_else(|| format!("{} must be a finite number", field.label))?,
                );
            }
        }
        Ok(Value::Object(values))
    }
}
