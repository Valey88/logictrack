import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api";
import { User } from "../types";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: async (data) => {
      console.log("Login response:", data);
      // Сохраняем токен (может быть как access_token, так и accessToken после конвертации)
      const token = data.access_token || data.accessToken;
      if (token) {
        console.log("Saving token to localStorage");
        localStorage.setItem("auth_token", token);
        // Сразу получаем данные пользователя и сохраняем в кэш
        try {
          console.log("Fetching user data...");
          const userData = await apiClient.getMe();
          console.log("User data received:", userData);
          queryClient.setQueryData(["me"], userData);
          // Также инвалидируем, чтобы убедиться, что данные обновятся везде
          await queryClient.invalidateQueries({ queryKey: ["me"] });
        } catch (error) {
          console.error("Failed to fetch user data after login:", error);
          // Если не удалось получить данные, инвалидируем и пытаемся снова
          await queryClient.invalidateQueries({ queryKey: ["me"] });
          await queryClient.refetchQueries({ queryKey: ["me"] });
        }
      } else {
        console.error("No access token in login response:", data);
      }
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      full_name?: string;
      phone?: string;
      role?: string;
    }) => apiClient.register(data),
    onSuccess: async (data) => {
      // Auto-login after registration
      const token = data.access_token || data.accessToken;
      if (token) {
        localStorage.setItem("auth_token", token);
        // Сразу получаем данные пользователя и сохраняем в кэш
        try {
          const userData = await apiClient.getMe();
          queryClient.setQueryData(["me"], userData);
        } catch (error) {
          console.error("Failed to fetch user data after registration:", error);
          // Если не удалось получить данные, инвалидируем и пытаемся снова
          await queryClient.invalidateQueries({ queryKey: ["me"] });
          await queryClient.refetchQueries({ queryKey: ["me"] });
        }
      } else {
        console.error("No access token in registration response:", data);
      }
    },
  });
};

export const useMe = () => {
  // Проверяем наличие токена при каждом рендере
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      console.log(
        "Fetching /auth/me with token:",
        token ? "present" : "missing"
      );
      const userData = await apiClient.getMe();
      console.log("User data from /auth/me:", userData);
      return userData;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    queryClient.clear();
    window.location.href = "/";
  };
};
