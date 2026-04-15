use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Operator,
    Admin,
    Owner,
}

impl Role {
    pub fn from_db(value: &str) -> Option<Self> {
        match value {
            "operator" => Some(Self::Operator),
            "admin" => Some(Self::Admin),
            "owner" => Some(Self::Owner),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Operator => "operator",
            Self::Admin => "admin",
            Self::Owner => "owner",
        }
    }

    pub fn can_manage_users(&self) -> bool {
        matches!(self, Self::Admin | Self::Owner)
    }

    pub fn can_manage_marketplace(&self) -> bool {
        matches!(self, Self::Admin | Self::Owner)
    }

    pub fn can_view_finance(&self) -> bool {
        matches!(self, Self::Admin | Self::Owner)
    }

    pub fn can_view_stats(&self) -> bool {
        true
    }

    pub fn can_view_workload(&self) -> bool {
        true
    }

    pub fn can_edit_role(&self, target: Role) -> bool {
        match self {
            Self::Owner => matches!(target, Role::Admin | Role::Operator),
            Self::Admin => matches!(target, Role::Operator),
            Self::Operator => false,
        }
    }
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}
