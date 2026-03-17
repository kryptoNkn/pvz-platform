use actix_web::{
    dev::{ServiceRequest, ServiceResponse, Transform, Service, forward_ready},
    Error, HttpResponse, HttpMessage,
    body::EitherBody,
};
use futures_util::future::{LocalBoxFuture, ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::rc::Rc;
use crate::utils::jwt::AccessClaims;
use crate::utils::tokens::get_jwt_secret;

pub struct Auth;

impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware { service: Rc::new(service) }))
    }
}

pub struct AuthMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = self.service.clone();

        Box::pin(async move {
            if req.method() == actix_web::http::Method::OPTIONS {
                let res = srv.call(req).await?;
                return Ok(res.map_into_left_body());
            }

            let path = req.path();
            let public_routes = [
                "/auth/register",
                "/auth/login",
                "/auth/refresh",
                "/users/check-username",
                "/",
            ];

            if public_routes.iter().any(|&route| path == route) || path.starts_with("/uploads/") {
                let res = srv.call(req).await?;
                return Ok(res.map_into_left_body());
            }

            let jwt = req
                .headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer ").map(str::to_owned))
                .or_else(|| {
                    req.cookie("access_token").map(|c| c.value().to_owned())
                });

            if let Some(jwt) = jwt {
                let secret = get_jwt_secret();
                if let Ok(data) = decode::<AccessClaims>(
                    &jwt,
                    &DecodingKey::from_secret(&secret),
                    &Validation::default(),
                ) {
                    req.extensions_mut().insert(data.claims.sub);
                    let res = srv.call(req).await?;
                    return Ok(res.map_into_left_body());
                }
            }

            let resp = HttpResponse::Unauthorized().finish().map_into_right_body();
            Ok(req.into_response(resp))
        })
    }
}