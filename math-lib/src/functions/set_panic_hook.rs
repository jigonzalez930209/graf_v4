use wasm_bindgen::prelude::*;

// A utility function to set up panic hooks, which will forward
// Rust's panic messages to the browser's console.
#[wasm_bindgen]
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
