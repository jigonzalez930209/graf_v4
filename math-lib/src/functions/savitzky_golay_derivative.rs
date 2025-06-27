use js_sys::Float64Array;
use wasm_bindgen::prelude::*;
use web_sys::console;
use crate::numerical_derivative;

/// Calculates the first derivative using a Savitzky-Golay filter.
#[wasm_bindgen]
pub fn savitzky_golay_derivative(window_size: usize, poly_order: usize, coords_js: Float64Array) -> Float64Array {
    let coords: Vec<f64> = coords_js.to_vec();
    if coords.len() % 2 != 0 {
        console::error_1(&"Input must be interleaved x,y pairs".into());
        return Float64Array::new_with_length(0);
    }
    let n = coords.len() / 2;
    if n < window_size {
        console::warn_1(&format!("Falling back to numerical_derivative: need {} points for window", window_size).into());
        return numerical_derivative(coords_js);
    }
    let half = window_size / 2;
    let mut result = Vec::with_capacity(coords.len());

    for i in 0..n {
        if i < half || i >= n - half {
            // edge difference
            let (dx, dy) = if i == 0 {
                (coords[2 * (i + 1)] - coords[2 * i], coords[2 * (i + 1) + 1] - coords[2 * i + 1])
            } else if i == n - 1 {
                (coords[2 * i] - coords[2 * (i - 1)], coords[2 * i + 1] - coords[2 * (i - 1) + 1])
            } else {
                (coords[2 * (i + 1)] - coords[2 * (i - 1)], coords[2 * (i + 1) + 1] - coords[2 * (i - 1) + 1])
            };
            let deriv = if dx.abs() < 1e-12 { 0.0 } else { dy / dx };
            result.push(coords[2 * i]);
            result.push(deriv);
        } else {
            // interior: fit polynomial and take first derivative c[1]
            let mut x_rel = Vec::with_capacity(window_size);
            let mut y_vals = Vec::with_capacity(window_size);
            let center = coords[2 * i];
            for j in (i - half)..=(i + half) {
                x_rel.push(coords[2 * j] - center);
                y_vals.push(coords[2 * j + 1]);
            }
            let m = poly_order + 1;
            let mut a = vec![vec![0.0; m]; m];
            let mut b = vec![0.0; m];
            // build normal equations
            for r in 0..m {
                for c in 0..m {
                    a[r][c] = x_rel.iter().map(|x| x.powi((r + c) as i32)).sum();
                }
                b[r] = x_rel.iter().zip(&y_vals).map(|(x, y)| y * x.powi(r as i32)).sum();
            }
            // gaussian elimination
            for p in 0..m {
                let mut max = p;
                for q in p + 1..m {
                    if a[q][p].abs() > a[max][p].abs() { max = q; }
                }
                a.swap(p, max);
                b.swap(p, max);
                let piv = a[p][p];
                if piv.abs() < 1e-12 {
                    console::warn_1(&format!("Singular matrix at idx {}", i).into());
                    result.push(center);
                    result.push(0.0);
                    continue;
                }
                for q in (p + 1)..m {
                    let fac = a[q][p] / piv;
                    for r2 in p..m { a[q][r2] -= fac * a[p][r2]; }
                    b[q] -= fac * b[p];
                }
            }
            let mut coeffs = vec![0.0; m];
            for p in (0..m).rev() {
                let sum: f64 = (p + 1..m).map(|r| a[p][r] * coeffs[r]).sum();
                coeffs[p] = (b[p] - sum) / a[p][p];
            }
            let deriv = if coeffs.len() > 1 { coeffs[1] } else { 0.0 };
            result.push(center);
            result.push(deriv);
        }
    }
    Float64Array::from(&result[..])
}
