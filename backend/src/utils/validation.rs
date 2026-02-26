use crate::models::{RegisterUser, LoginUser};

#[derive(Debug, Clone)]
pub enum ValidationError {
    EmptyFullName,
    InvalidFullName,
    InvalidPhone,
    WeakPassword,
    EmptyCredentials,
    PhoneTaken,
}

pub fn validate_register_input(user: &RegisterUser) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    if user.full_name.trim().is_empty() {
        errors.push(ValidationError::EmptyFullName);
    } else if !is_valid_full_name(&user.full_name) {
        errors.push(ValidationError::InvalidFullName);
    }

    if !is_valid_phone(&user.phone) {
        errors.push(ValidationError::InvalidPhone);
    }

    if !is_strong_password(&user.password) {
        errors.push(ValidationError::WeakPassword);
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

pub fn validate_login_input(user: &LoginUser) -> Result<(), Vec<ValidationError>> {
    if user.phone.trim().is_empty() || user.password.trim().is_empty() {
        return Err(vec![ValidationError::EmptyCredentials]);
    }

    Ok(())
}

fn is_valid_full_name(name: &str) -> bool {
    let name = name.trim();

    if name.len() < 5 || name.len() > 100 {
        return false;
    }

    let words: Vec<&str> = name.split_whitespace().collect();
    if words.len() != 3 {
        return false;
    }

    words.iter().all(|word| {
        word.len() >= 2 && word.chars().all(|c| c.is_alphabetic())
    })
}

fn is_valid_phone(phone: &str) -> bool {
    let phone = phone.trim();

    if phone.is_empty() {
        return false;
    }

    let normalized: String = phone
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '+')
        .collect();

    let re = regex::Regex::new(r"^(\+7|7|8)\d{10}$").unwrap();
    re.is_match(&normalized)
}

fn is_strong_password(password: &str) -> bool {
    let password = password.trim();

    password.len() >= 8
        && password.chars().any(|c| c.is_ascii_lowercase())
        && password.chars().any(|c| c.is_ascii_uppercase())
        && password.chars().any(|c| c.is_ascii_digit())
}