declare module "@lovable.dev/cloud-auth-js" {
  export type OAuthProvider = "google" | "apple" | "microsoft";

  export interface OAuthTokens {
    access_token: string;
    refresh_token: string;
  }

  export interface OAuthResult {
    redirected?: boolean;
    error?: Error;
    tokens: OAuthTokens;
  }

  export function createLovableAuth(): {
    signInWithOAuth: (
      provider: OAuthProvider,
      options?: {
        redirect_uri?: string;
        extraParams?: Record<string, string>;
      },
    ) => Promise<OAuthResult>;
  };
}
