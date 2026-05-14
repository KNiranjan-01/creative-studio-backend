// ROLES
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
};

// PLATFORM-LEVEL PERMISSIONS (for super_admin actions)
const PERMISSIONS = {
  PLATFORM_ORG_VIEW_ALL:     'platform:org:view_all',
  PLATFORM_ORG_RESTORE:      'platform:org:restore',
  PLATFORM_ORG_FORCE_DELETE: 'platform:org:force_delete',
  PLATFORM_USER_VIEW_ALL:    'platform:user:view_all',
};

// ORG-LEVEL FEATURE FLAGS (what an Admin can toggle for a Member)
const FEATURES = {
  DASHBOARD:         'dashboard',
  PLANNER:           'planner',
  GENERATOR:         'generator',
  TOOLBOX:           'toolbox',
  CONNECTIONS:       'connections',
  REPORTS:           'reports',
  ASSETS:            'assets',
  HISTORY:           'history',
  WORKFLOWS:         'workflows',
  ORG_SETTINGS:      'org_settings',
};

// ORG-SCOPED MEMBER ROLES
const ORG_ROLES = {
  OWNER:   'owner',   // The Admin who created the org (auto-assigned)
  MANAGER: 'manager',
  EDITOR:  'editor',
  VIEWER:  'viewer',
};

// Platform-level role → permitted PERMISSIONS
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  [ROLES.ADMIN]:       [],  // No platform-level permissions
  [ROLES.MEMBER]:      [],  // No platform-level permissions
};

// Default features enabled per org-scoped role
const ORG_ROLE_DEFAULT_FEATURES = {
  [ORG_ROLES.OWNER]:   Object.values(FEATURES),
  [ORG_ROLES.MANAGER]: [FEATURES.DASHBOARD, FEATURES.PLANNER, FEATURES.GENERATOR, FEATURES.TOOLBOX, FEATURES.CONNECTIONS, FEATURES.REPORTS, FEATURES.ASSETS, FEATURES.HISTORY],
  [ORG_ROLES.EDITOR]:  [FEATURES.DASHBOARD, FEATURES.PLANNER, FEATURES.GENERATOR, FEATURES.TOOLBOX, FEATURES.ASSETS, FEATURES.HISTORY],
  [ORG_ROLES.VIEWER]:  [FEATURES.DASHBOARD, FEATURES.REPORTS, FEATURES.ASSETS, FEATURES.HISTORY],
};

module.exports = { 
  ROLES, 
  PERMISSIONS, 
  FEATURES, 
  ORG_ROLES, 
  ROLE_PERMISSIONS, 
  ORG_ROLE_DEFAULT_FEATURES 
};
