use rust_decimal::{Decimal, MathematicalOps};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct Point {
    x: String,
    y: String,
}

#[derive(Serialize)]
pub struct FitResult {
    pub coefficients: Vec<String>,
    pub r2: String,
    pub mse: String,
}

fn solve_linear_system(mut a: Vec<Vec<Decimal>>, mut b: Vec<Decimal>) -> Option<Vec<Decimal>> {
    let n = b.len();
    for i in 0..n {
        let mut max_row = i;
        for k in i + 1..n {
            if a[k][i].abs() > a[max_row][i].abs() {
                max_row = k;
            }
        }
        a.swap(i, max_row);
        b.swap(i, max_row);

        if a[i][i].is_zero() {
            return None; // No unique solution
        }

        for k in i + 1..n {
            let factor = a[k][i] / a[i][i];
            let temp_b = b[i];
            b[k] -= factor * temp_b;
            for j in i..n {
                let temp = a[i][j] * factor;
                a[k][j] -= temp;
            }
        }
    }

    let mut x = vec![Decimal::ZERO; n];
    for i in (0..n).rev() {
        let mut sum = Decimal::ZERO;
        for j in i + 1..n {
            sum += a[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / a[i][i];
    }
    Some(x)
}

#[wasm_bindgen]
pub fn polynomial_fit(points_json: &str, degree: usize) -> Result<JsValue, JsValue> {
    let points: Vec<Point> = serde_json::from_str(points_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse points: {}", e)))?;

    if points.is_empty() {
        return Err(JsValue::from_str("Input points array cannot be empty."));
    }

    let n = points.len();
    if n <= degree {
        return Err(JsValue::from_str(
            "The number of points must be greater than the polynomial degree.",
        ));
    }

    let coords_x: Vec<Decimal> = points
        .iter()
        .map(|p| Decimal::from_str(&p.x).unwrap_or_default())
        .collect();
    let coords_y: Vec<Decimal> = points
        .iter()
        .map(|p| Decimal::from_str(&p.y).unwrap_or_default())
        .collect();

    let mut x_matrix = vec![vec![Decimal::ZERO; degree + 1]; n];
    for i in 0..n {
        for j in 0..=degree {
            x_matrix[i][j] = coords_x[i].powi(j as i64);
        }
    }

    let xt_matrix = (0..=degree)
        .map(|i| (0..n).map(|j| x_matrix[j][i]).collect::<Vec<Decimal>>())
        .collect::<Vec<Vec<Decimal>>>();

    let xtx_matrix = (0..=degree)
        .map(|i| {
            (0..=degree)
                .map(|j| {
                    (0..n)
                        .map(|k| xt_matrix[i][k] * x_matrix[k][j])
                        .sum::<Decimal>()
                })
                .collect::<Vec<Decimal>>()
        })
        .collect::<Vec<Vec<Decimal>>>();

    let xty_vector = (0..=degree)
        .map(|i| (0..n).map(|k| xt_matrix[i][k] * coords_y[k]).sum())
        .collect::<Vec<Decimal>>();

    let coefficients = solve_linear_system(xtx_matrix, xty_vector)
        .ok_or_else(|| JsValue::from_str("Failed to solve the linear system."))?;

    let y_mean: Decimal = coords_y.iter().sum::<Decimal>() / Decimal::from(n);
    let mut total_sum_squares = Decimal::ZERO;
    let mut residual_sum_squares = Decimal::ZERO;

    for i in 0..n {
        let y_actual = coords_y[i];
        let mut y_predicted = Decimal::ZERO;
        for (j, &coeff) in coefficients.iter().enumerate() {
            y_predicted += coeff * coords_x[i].powi(j as i64);
        }

        total_sum_squares += (y_actual - y_mean).powi(2);
        residual_sum_squares += (y_actual - y_predicted).powi(2);
    }

    let r2 = if total_sum_squares.is_zero() {
        Decimal::ONE
    } else {
        Decimal::ONE - (residual_sum_squares / total_sum_squares)
    };
    let mse = residual_sum_squares / Decimal::from(n);

    let result = FitResult {
        coefficients: coefficients.iter().map(|c| c.to_string()).collect(),
        r2: r2.to_string(),
        mse: mse.to_string(),
    };

    serde_wasm_bindgen::to_value(&result).map_err(|e| e.into())
}
