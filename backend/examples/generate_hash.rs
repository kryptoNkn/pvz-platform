use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHasher};
use rand::rngs::OsRng;

fn main() {
    let passwords = ["operator123", "admin123", "owner123"];
    for password in passwords {
        let salt = SaltString::generate(&mut OsRng);
        let hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .expect("hash");
        println!("{}:{}", password, hash.to_string());
    }
}
