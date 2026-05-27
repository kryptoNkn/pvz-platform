use actix_web::cookie::{Cookie, SameSite, time::Duration};

pub fn access_cookie(token: String) -> Cookie<'static> {
    Cookie::build("access_token", token)
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(Duration::minutes(15))
        .finish()
}

pub fn refresh_cookie(token: String) -> Cookie<'static> {
    Cookie::build("refresh_token", token)
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .path("/auth/refresh")
        .max_age(Duration::days(30))
        .finish()
}
