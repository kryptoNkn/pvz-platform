use actix_web::HttpResponse;
use crate::utils::{validation::ValidationError};

fn validation_error_message(error: &ValidationError) -> &'static str {
    match error {
        ValidationError::EmptyFullName => "Full name cannot be empty",
        ValidationError::InvalidFullName => "Full name must be 3-100 characters and contain only letters, numbers and spaces",
        ValidationError::InvalidPhone => "Invalid phone format",
        ValidationError::WeakPassword => "Password must be at least 8 characters and contain uppercase letter, lowercase letter and digit",
        ValidationError::EmptyCredentials => "Email and password are required",
        ValidationError::PhoneTaken => "Phone is already in use",
    }
}

pub fn validation_error_to_response(errors: Vec<ValidationError>) -> HttpResponse {
    let messages: Vec<&str> = errors
        .iter()
        .map(validation_error_message)
        .collect();

    HttpResponse::BadRequest().json(messages)
}