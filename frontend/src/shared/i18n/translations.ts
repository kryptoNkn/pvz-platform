export type Lang = 'ru' | 'en'

export interface Translations {
    // auth
    welcome: string
    signInToAccount: string
    phone: string
    password: string
    signingIn: string
    signIn: string
    noAccount: string
    register: string
    loginError: string
    connectionError: string
    createAccount: string
    enterFullName: string
    enterPassword: string
    confirmPassword: string
    registering: string
    alreadyHaveAccount: string
    passwordsDoNotMatch: string
    registrationError: string
    // sidebar / logout
    logoutTitle: string
    logoutConfirm: string
    cancel: string
    logout: string
    // layout pending
    accountRegistered: string
    pendingText: string
    pendingRefresh: string
    // workload
    totalItems: string
    acceptance: string
    delivery: string
    returns: string
    searchPlaceholder: string
    points: (n: number) => string
    employees: string
    addPvz: string
    colName: string
    colAddress: string
    colLoad: string
    colStatus: string
    colHours: string
    colTraffic: string
    statusActive: string
    statusOverloaded: string
    statusInactive: string
    // stats
    loading: string
    totalPvz: string
    totalPvzSub: string
    active: string
    ofTotal: (n: number) => string
    overloaded: string
    inactive: string
    statusDistribution: string
    opsTotal: string
    opsTotalSub: string
    acceptanceStat: string
    ofOps: (n: number) => string
    deliveryStat: string
    returnsStat: string
    opsBreakdown: string
    barActive: (n: number) => string
    barOverloaded: (n: number) => string
    barClosed: (n: number) => string
    barAcceptance: (n: number) => string
    barDelivery: (n: number) => string
    barReturns: (n: number) => string
    // finance
    revenue: string
    expenses: string
    netProfit: string
    transactions: string
    forPeriod: string
    avgCheck: string
    perOperation: string
    margin: string
    ofRevenue: string
    monthlyDynamics: string
    month: string
    profit: string
    // employees
    employeesList: string
    searchEmployee: string
    back: string
    colEmployee: string
    colRole: string
    noUsersFound: string
    rolePending: string
    roleOperator: string
    roleAdmin: string
    roleOwner: string
    // add-pvz
    addPvzTitle: string
    mainParams: string
    pvzAddress: string
    enterAddress: string
    throughput: string
    throughputPlaceholder: string
    workSchedule: string
    colDay: string
    colWorkHours: string
    dayOff: string
    workDay: string
    saveChanges: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    // profile
    roleOwnerLabel: string
    roleAdminLabel: string
    roleOperatorLabel: string
    rolePendingLabel: string
    roleUserLabel: string
    changeAvatar: string
    avatarUpdated: string
    avatarError: string
    phoneLabel: string
    memberSince: string
    roleLabel: string
    editProfile: string
    fullName: string
    fullNamePlaceholder: string
    saveError: string
    networkError: string
    saved: string
    saving: string
    save: string
    security: string
    currentPassword: string
    newPassword: string
    confirmPasswordLabel: string
    passwordMismatch: string
    passwordTooShort: string
    passwordChanged: string
    changing: string
    changePassword: string
    // notifications panel
    notifications: string
    noNotifications: string
    // settings page
    settingsAccount: string
    settingsEditProfile: string
    settingsChangePassword: string
    settingsAppearance: string
    settingsTheme: string
    settingsLight: string
    settingsDark: string
    settingsLanguage: string
    settingsNotifications: string
    settingsRoleChange: string
    settingsRoleChangeDesc: string
    settingsSystemNotifs: string
    settingsSystemNotifsDesc: string
    settingsAbout: string
    settingsVersion: string
    settingsPlatform: string
    settingsLogout: string
    settingsSaved: string
    // locale for number/date formatting
    locale: string
}

const ru: Translations = {
    welcome: 'Добро пожаловать!',
    signInToAccount: 'Войдите в свой аккаунт',
    phone: 'Телефон',
    password: 'Пароль',
    signingIn: 'Вход...',
    signIn: 'Войти',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться',
    loginError: 'Ошибка входа',
    connectionError: 'Ошибка соединения с сервером',
    createAccount: 'Создать аккаунт',
    enterFullName: 'Введите ФИО',
    enterPassword: 'Введите пароль',
    confirmPassword: 'Повторите пароль',
    registering: 'Регистрация...',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    passwordsDoNotMatch: 'Пароли не совпадают',
    registrationError: 'Ошибка регистрации',
    logoutTitle: 'Выйти из аккаунта?',
    logoutConfirm: 'Вы уверены, что хотите выйти?',
    cancel: 'Отмена',
    logout: 'Выйти',
    accountRegistered: 'Аккаунт зарегистрирован',
    pendingText: 'Ожидайте назначения роли от администратора.',
    pendingRefresh: 'После назначения обновите страницу.',
    totalItems: 'Всего товаров',
    acceptance: 'Приёмка',
    delivery: 'Выдача',
    returns: 'Возврат',
    searchPlaceholder: 'Поиск по названию или адресу...',
    points: (n) => `${n} пунктов`,
    employees: 'Сотрудники',
    addPvz: 'Добавить ПВЗ',
    colName: 'Название',
    colAddress: 'Адрес',
    colLoad: 'Загрузка, %',
    colStatus: 'Статус',
    colHours: 'Часы работы',
    colTraffic: 'Трафик',
    statusActive: 'Активен',
    statusOverloaded: 'Перегружен',
    statusInactive: 'Неактивен',
    loading: 'Загрузка...',
    totalPvz: 'Всего ПВЗ',
    totalPvzSub: 'всего объектов',
    active: 'Активных',
    ofTotal: (n) => `${n}% от общего числа`,
    overloaded: 'Перегружено',
    inactive: 'Неактивных',
    statusDistribution: 'Распределение статусов ПВЗ',
    opsTotal: 'Всего товаров',
    opsTotalSub: 'на всех ПВЗ',
    acceptanceStat: 'Приёмка',
    ofOps: (n) => `${n}% операций`,
    deliveryStat: 'Выдача',
    returnsStat: 'Возвраты',
    opsBreakdown: 'Соотношение операций',
    barActive: (n) => `Активен ${n}%`,
    barOverloaded: (n) => `Перегружен ${n}%`,
    barClosed: (n) => `Неактивен ${n}%`,
    barAcceptance: (n) => `Приёмка ${n}%`,
    barDelivery: (n) => `Выдача ${n}%`,
    barReturns: (n) => `Возвраты ${n}%`,
    revenue: 'Выручка',
    expenses: 'Расходы',
    netProfit: 'Чистая прибыль',
    transactions: 'Транзакции',
    forPeriod: 'за текущий период',
    avgCheck: 'Средний чек',
    perOperation: 'на одну операцию',
    margin: 'Маржа',
    ofRevenue: 'от выручки',
    monthlyDynamics: 'Динамика по месяцам',
    month: 'Месяц',
    profit: 'Прибыль',
    employeesList: 'Список сотрудников',
    searchEmployee: 'Поиск сотрудника...',
    back: 'Назад',
    colEmployee: 'Сотрудник',
    colRole: 'Роль',
    noUsersFound: 'Пользователи не найдены',
    rolePending: 'Ожидает назначения',
    roleOperator: 'Оператор',
    roleAdmin: 'Администратор',
    roleOwner: 'Владелец',
    addPvzTitle: 'Добавить новый ПВЗ...',
    mainParams: 'Основные параметры',
    pvzAddress: 'Адрес ПВЗ',
    enterAddress: 'Введите адрес',
    throughput: 'Пропускная способность (оп/час)',
    throughputPlaceholder: 'Например, 120',
    workSchedule: 'График работы',
    colDay: 'День',
    colWorkHours: 'Время работы',
    dayOff: 'Выходной',
    workDay: 'Рабочий',
    saveChanges: 'Сохранить изменения',
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
    roleOwnerLabel: 'Владелец',
    roleAdminLabel: 'Администратор',
    roleOperatorLabel: 'Оператор',
    rolePendingLabel: 'Ожидает активации',
    roleUserLabel: 'Пользователь',
    changeAvatar: 'Изменить',
    avatarUpdated: '✓ Аватар обновлён',
    avatarError: '✕ Ошибка загрузки',
    phoneLabel: 'Телефон',
    memberSince: 'В системе с',
    roleLabel: 'Роль',
    editProfile: 'Редактировать профиль',
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Иванов Иван Иванович',
    saveError: 'Ошибка сохранения',
    networkError: 'Ошибка сети',
    saved: '✓ Сохранено',
    saving: 'Сохранение…',
    save: 'Сохранить',
    security: 'Безопасность',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPasswordLabel: 'Подтвердите пароль',
    passwordMismatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен быть не менее 8 символов',
    passwordChanged: '✓ Пароль изменён',
    changing: 'Изменение…',
    changePassword: 'Изменить пароль',
    notifications: 'Уведомления',
    noNotifications: 'Нет уведомлений',
    settingsAccount: 'Аккаунт',
    settingsEditProfile: 'Редактировать профиль',
    settingsChangePassword: 'Изменить пароль',
    settingsAppearance: 'Внешний вид',
    settingsTheme: 'Тема',
    settingsLight: 'Светлая',
    settingsDark: 'Тёмная',
    settingsLanguage: 'Язык',
    settingsNotifications: 'Уведомления',
    settingsRoleChange: 'Смена роли',
    settingsRoleChangeDesc: 'Уведомлять при изменении вашей роли',
    settingsSystemNotifs: 'Системные уведомления',
    settingsSystemNotifsDesc: 'Информация от администраторов системы',
    settingsAbout: 'О системе',
    settingsVersion: 'Версия',
    settingsPlatform: 'Платформа',
    settingsLogout: 'Выйти из аккаунта',
    settingsSaved: 'Настройки сохранены',
    locale: 'ru-RU',
}

const en: Translations = {
    welcome: 'Welcome!',
    signInToAccount: 'Sign in to your account',
    phone: 'Phone',
    password: 'Password',
    signingIn: 'Signing in...',
    signIn: 'Sign in',
    noAccount: 'No account?',
    register: 'Register',
    loginError: 'Login error',
    connectionError: 'Server connection error',
    createAccount: 'Create account',
    enterFullName: 'Enter full name',
    enterPassword: 'Enter password',
    confirmPassword: 'Confirm password',
    registering: 'Registering...',
    alreadyHaveAccount: 'Already have an account?',
    passwordsDoNotMatch: 'Passwords do not match',
    registrationError: 'Registration error',
    logoutTitle: 'Log out?',
    logoutConfirm: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    logout: 'Log out',
    accountRegistered: 'Account registered',
    pendingText: 'Waiting for role assignment from administrator.',
    pendingRefresh: 'Refresh the page after assignment.',
    totalItems: 'Total items',
    acceptance: 'Acceptance',
    delivery: 'Delivery',
    returns: 'Returns',
    searchPlaceholder: 'Search by name or address...',
    points: (n) => `${n} locations`,
    employees: 'Employees',
    addPvz: 'Add PVZ',
    colName: 'Name',
    colAddress: 'Address',
    colLoad: 'Load, %',
    colStatus: 'Status',
    colHours: 'Working hours',
    colTraffic: 'Traffic',
    statusActive: 'Active',
    statusOverloaded: 'Overloaded',
    statusInactive: 'Inactive',
    loading: 'Loading...',
    totalPvz: 'Total PVZ',
    totalPvzSub: 'total locations',
    active: 'Active',
    ofTotal: (n) => `${n}% of total`,
    overloaded: 'Overloaded',
    inactive: 'Inactive',
    statusDistribution: 'PVZ Status Distribution',
    opsTotal: 'Total items',
    opsTotalSub: 'across all PVZ',
    acceptanceStat: 'Acceptance',
    ofOps: (n) => `${n}% of ops`,
    deliveryStat: 'Delivery',
    returnsStat: 'Returns',
    opsBreakdown: 'Operations Breakdown',
    barActive: (n) => `Active ${n}%`,
    barOverloaded: (n) => `Overloaded ${n}%`,
    barClosed: (n) => `Inactive ${n}%`,
    barAcceptance: (n) => `Acceptance ${n}%`,
    barDelivery: (n) => `Delivery ${n}%`,
    barReturns: (n) => `Returns ${n}%`,
    revenue: 'Revenue',
    expenses: 'Expenses',
    netProfit: 'Net profit',
    transactions: 'Transactions',
    forPeriod: 'for current period',
    avgCheck: 'Average check',
    perOperation: 'per operation',
    margin: 'Margin',
    ofRevenue: 'of revenue',
    monthlyDynamics: 'Monthly dynamics',
    month: 'Month',
    profit: 'Profit',
    employeesList: 'Employees',
    searchEmployee: 'Search employee...',
    back: 'Back',
    colEmployee: 'Employee',
    colRole: 'Role',
    noUsersFound: 'No users found',
    rolePending: 'Pending',
    roleOperator: 'Operator',
    roleAdmin: 'Administrator',
    roleOwner: 'Owner',
    addPvzTitle: 'Add new PVZ...',
    mainParams: 'Main parameters',
    pvzAddress: 'PVZ address',
    enterAddress: 'Enter address',
    throughput: 'Throughput (ops/hour)',
    throughputPlaceholder: 'E.g., 120',
    workSchedule: 'Work schedule',
    colDay: 'Day',
    colWorkHours: 'Working hours',
    dayOff: 'Day off',
    workDay: 'Working',
    saveChanges: 'Save changes',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    roleOwnerLabel: 'Owner',
    roleAdminLabel: 'Administrator',
    roleOperatorLabel: 'Operator',
    rolePendingLabel: 'Awaiting activation',
    roleUserLabel: 'User',
    changeAvatar: 'Change',
    avatarUpdated: '✓ Avatar updated',
    avatarError: '✕ Upload error',
    phoneLabel: 'Phone',
    memberSince: 'Member since',
    roleLabel: 'Role',
    editProfile: 'Edit profile',
    fullName: 'Full name',
    fullNamePlaceholder: 'John Smith',
    saveError: 'Save error',
    networkError: 'Network error',
    saved: '✓ Saved',
    saving: 'Saving...',
    save: 'Save',
    security: 'Security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPasswordLabel: 'Confirm password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordChanged: '✓ Password changed',
    changing: 'Changing...',
    changePassword: 'Change password',
    notifications: 'Notifications',
    noNotifications: 'No notifications',
    settingsAccount: 'Account',
    settingsEditProfile: 'Edit profile',
    settingsChangePassword: 'Change password',
    settingsAppearance: 'Appearance',
    settingsTheme: 'Theme',
    settingsLight: 'Light',
    settingsDark: 'Dark',
    settingsLanguage: 'Language',
    settingsNotifications: 'Notifications',
    settingsRoleChange: 'Role change',
    settingsRoleChangeDesc: 'Notify when your role changes',
    settingsSystemNotifs: 'System notifications',
    settingsSystemNotifsDesc: 'Information from system administrators',
    settingsAbout: 'About',
    settingsVersion: 'Version',
    settingsPlatform: 'Platform',
    settingsLogout: 'Log out',
    settingsSaved: 'Settings saved',
    locale: 'en-US',
}

export const translations: Record<Lang, Translations> = { ru, en }
