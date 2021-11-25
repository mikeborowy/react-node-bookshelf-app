/** @jsx jsx */
import {jsx} from '@emotion/core'

import * as React from 'react'
import {queryCache} from 'react-query'
import * as authHelpers from './auth-helpers'
import {apiClient} from 'utils/api-client'
import {useAsync} from 'hooks/use-async'
import {setQueryDataForBook} from 'api/books'
import {FullPageSpinner, FullPageErrorFallback} from 'components/lib'

async function initPreloadAppData() {
  let user = null

  const token = await authHelpers.getToken()
  if (token) {
    const data = await apiClient('init-preload', {token})
    queryCache.setQueryData('list-items', data.listItems, {
      staleTime: 5000,
    })
    for (const listItem of data.listItems) {
      setQueryDataForBook(listItem.book)
    }
    user = data.user
  }
  return user
}

const AuthContext = React.createContext()
AuthContext.displayName = 'AuthContext'

function AuthProvider(props) {
  const {
    data: user,
    status,
    error,
    isLoading,
    isIdle,
    isError,
    isSuccess,
    executePromise,
    setData,
  } = useAsync()

  React.useEffect(() => {
    const appDataPromise = initPreloadAppData()
    executePromise(appDataPromise)
  }, [executePromise])

  const login = React.useCallback(
    form => authHelpers.login(form).then(user => setData(user)),
    [setData],
  )
  const register = React.useCallback(
    form => authHelpers.register(form).then(user => setData(user)),
    [setData],
  )
  const logout = React.useCallback(() => {
    authHelpers.logout()
    queryCache.clear()
    setData(null)
  }, [setData])

  const value = React.useMemo(
    () => ({user, login, logout, register}),
    [login, logout, register, user],
  )

  if (isLoading || isIdle) {
    return <FullPageSpinner />
  }

  if (isError) {
    return <FullPageErrorFallback error={error} />
  }

  if (isSuccess) {
    return <AuthContext.Provider value={value} {...props} />
  }

  throw new Error(`Unhandled status: ${status}`)
}

function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error(`useAuth must be used within a AuthProvider`)
  }
  return context
}

function useAuthenticatedClient() {
  const {user} = useAuth()
  const token = user?.token
  return React.useCallback(
    (endpoint, config) => apiClient(endpoint, {...config, token}),
    [token],
  )
}

export {AuthProvider, useAuth, useAuthenticatedClient}
