import { ScriptOnce } from "@tanstack/react-router";
import { createClientOnlyFn, createIsomorphicFn } from "@tanstack/react-start";
import { createContext, type ReactNode, use, useEffect, useState } from "react";

const validUserThemes = ["light", "dark", "system"] as const;
const validAppThemes = ["light", "dark"] as const;

export type UserTheme = (typeof validUserThemes)[number];
export type AppTheme = (typeof validAppThemes)[number];

function parseUserTheme(value: unknown): UserTheme {
  if (
    typeof value === "string" &&
    validUserThemes.includes(value as UserTheme)
  ) {
    return value as UserTheme;
  }
  return "system";
}

const themeStorageKey = "ui-theme";

const getStoredUserTheme = createIsomorphicFn()
  .server((): UserTheme => "system")
  .client((): UserTheme => {
    const stored = localStorage.getItem(themeStorageKey);
    return parseUserTheme(stored);
  });

const setStoredTheme = createClientOnlyFn((theme: UserTheme) => {
  const validatedTheme = parseUserTheme(theme);
  localStorage.setItem(themeStorageKey, validatedTheme);
});

const getSystemTheme = createIsomorphicFn()
  .server((): AppTheme => "light")
  .client((): AppTheme => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

const handleThemeChange = createClientOnlyFn((userTheme: UserTheme) => {
  const validatedTheme = parseUserTheme(userTheme);

  const root = document.documentElement;
  root.classList.remove("light", "dark", "system");

  if (validatedTheme === "system") {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme, "system");
  } else {
    root.classList.add(validatedTheme);
  }
});

const setupPreferredListener = createClientOnlyFn(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => handleThemeChange("system");
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
});

const themeScript = (() => {
  function themeFn() {
    try {
      const storedTheme = localStorage.getItem("ui-theme") || "system";
      const validTheme = ["light", "dark", "system"].includes(storedTheme)
        ? storedTheme
        : "system";

      if (validTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        document.documentElement.classList.add(systemTheme, "system");
      } else {
        document.documentElement.classList.add(validTheme);
      }
    } catch (_) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      document.documentElement.classList.add(systemTheme, "system");
    }
  }
  return `(${themeFn.toString()})();`;
})();

interface ThemeContextProps {
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
  userTheme: UserTheme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [userTheme, setUserTheme] = useState<UserTheme>(getStoredUserTheme);

  useEffect(() => {
    if (userTheme !== "system") {
      return;
    }

    return setupPreferredListener();
  }, [userTheme]);

  const appTheme = userTheme === "system" ? getSystemTheme() : userTheme;

  const setTheme = (newUserTheme: UserTheme) => {
    const validatedTheme = parseUserTheme(newUserTheme);
    setUserTheme(validatedTheme);
    setStoredTheme(validatedTheme);
    handleThemeChange(validatedTheme);
  };

  return (
    <ThemeContext value={{ userTheme, appTheme, setTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
