use lingua::{LanguageDetector, LanguageDetectorBuilder};
use neon::prelude::*;

use lazy_static::lazy_static;

lazy_static! {
    static ref DETECTOR: LanguageDetector =
        LanguageDetectorBuilder::from_all_spoken_languages().build();
}

fn hello(mut cx: FunctionContext) -> JsResult<JsString> {
    Ok(cx.string("hello node"))
}

fn detect_language(mut cx: FunctionContext) -> JsResult<JsString> {
    let text = cx.argument::<JsString>(0)?.value(&mut cx);

    println!("text: {}", text);

    let detected_language = DETECTOR.detect_language_of(text);

    println!("detected_language: {:?}", detected_language);

    let language = match detected_language {
        Some(language) => language.iso_code_639_1().to_string().to_ascii_lowercase(),
        None => "unk".to_string(),
    };
    println!("detected_language: {:?}", language);

    Ok(cx.string(&language))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("hello", hello)?;
    cx.export_function("detectLanguage", detect_language)?;
    Ok(())
}
