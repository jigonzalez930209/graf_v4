use wasm_bindgen::prelude::*;

// Declare modules
pub mod functions;
pub mod fits;

// Expose functions and structs to wasm
pub use functions::add::*;
pub use functions::process_curve::*;
pub use functions::numerical_derivative::*;
pub use functions::savitzky_golay_derivative::*;
pub use functions::savitzky_golay_smooth::*;
pub use functions::set_panic_hook::*;
pub use fits::polynomial_fit::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, math-lib!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = functions::add::add(2, 2);
        assert_eq!(result, 4);
    }
}
