import { UserRole } from "../types";

/**
 * Определяет маршрут для перенаправления пользователя после авторизации
 * @param role - Роль пользователя
 * @param orderCode - Опциональный код заказа для отслеживания
 * @returns Путь для перенаправления
 */
export const getRedirectPath = (
  role: UserRole,
  orderCode?: string | null
): string => {
  // Если есть код заказа, перенаправляем на страницу отслеживания
  if (orderCode) {
    return `/track/${orderCode}`;
  }

  // Администратор или диспетчер -> панель управления
  if (role === UserRole.ADMIN || role === UserRole.DISPATCHER) {
    return "/dashboard";
  }

  // Обычный пользователь (CLIENT) -> личный кабинет
  if (role === UserRole.CLIENT) {
    return "/client-portal";
  }

  // Водитель -> приложение водителя
  if (role === UserRole.DRIVER) {
    return "/driver";
  }

  // По умолчанию -> панель управления
  return "/dashboard";
};
