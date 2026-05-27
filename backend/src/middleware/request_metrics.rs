use actix_web::{
    Error,
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
};
use futures_util::future::{LocalBoxFuture, Ready, ready};
use std::rc::Rc;

use crate::observability::HTTP_REQUESTS_IN_FLIGHT;

pub struct RequestMetrics;

impl<S, B> Transform<S, ServiceRequest> for RequestMetrics
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = RequestMetricsMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RequestMetricsMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct RequestMetricsMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for RequestMetricsMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = self.service.clone();
        HTTP_REQUESTS_IN_FLIGHT.inc();

        Box::pin(async move {
            let result = srv.call(req).await;
            HTTP_REQUESTS_IN_FLIGHT.dec();
            result
        })
    }
}
