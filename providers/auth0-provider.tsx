"use client"

import { ReactNode } from "react"
import { Auth0Provider } from "@auth0/auth0-react"
import { useRouter } from "next/navigation"

interface Auth0ProviderWithNavigateProps {
  children: ReactNode
}

export function Auth0ProviderWithNavigate({ children }: Auth0ProviderWithNavigateProps) {
  const router = useRouter()
  
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : ''
  
  const onRedirectCallback = (appState: any) => {
    router.push(appState?.returnTo || window.location.pathname)
  }
  
  // Don't initialize Auth0 on the server
  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  // Don't initialize if credentials are missing
  if (!(domain && clientId)) {
    console.warn("Auth0 credentials are missing. Authentication will not work correctly.")
    return <>{children}</>
  }
  
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        scope: "openid profile email"
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  )
}