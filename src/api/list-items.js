import {useQuery, useMutation, queryCache} from 'react-query'
import {setQueryDataForBook} from './books'
import {useAuthenticatedClient} from 'contexts/auth-context'

function useListItem(bookId, options) {
  const listItems = useListItems(options)
  return listItems?.find(li => li.bookId === bookId) ?? null
}

function useListItems(options = {}) {
  const apiClient = useAuthenticatedClient()

  const {data: listItems} = useQuery({
    queryKey: 'list-items',
    queryFn: () => apiClient('list-items').then(data => data.listItems),
    ...options,
    config: {
      ...options.config,
      onSuccess: async listItems => {
        await options.config?.onSuccess?.(listItems)
        for (const listItem of listItems) {
          setQueryDataForBook(listItem.book)
        }
      },
    },
  })
  return listItems ?? []
}

const defaultMutationOptions = {
  onError: (err, variables, recover) =>
    typeof recover === 'function' ? recover() : null,
  onSettled: () => queryCache.invalidateQueries('list-items'),
}

function onUpdateMutation(newItem) {
  const previousItems = queryCache.getQueryData('list-items')

  queryCache.setQueryData('list-items', old => {
    return old.map(item => {
      return item.id === newItem.id ? {...item, ...newItem} : item
    })
  })

  return () => queryCache.setQueryData('list-items', previousItems)
}

function useUpdateListItem(options) {
  const apiClient = useAuthenticatedClient()

  return useMutation(
    updates =>
      apiClient(`list-items/${updates.id}`, {
        method: 'PUT',
        data: updates,
      }),
    {
      onMutate: onUpdateMutation,
      ...defaultMutationOptions,
      ...options,
    },
  )
}

function useRemoveListItem(options) {
  const apiClient = useAuthenticatedClient()

  return useMutation(
    ({id}) => apiClient(`list-items/${id}`, {method: 'DELETE'}),
    {
      onMutate: removedItem => {
        const previousItems = queryCache.getQueryData('list-items')

        queryCache.setQueryData('list-items', old => {
          return old.filter(item => item.id !== removedItem.id)
        })

        return () => queryCache.setQueryData('list-items', previousItems)
      },
      ...defaultMutationOptions,
      ...options,
    },
  )
}

function useCreateListItem(options) {
  const apiClient = useAuthenticatedClient()

  return useMutation(({bookId}) => apiClient('list-items', {data: {bookId}}), {
    ...defaultMutationOptions,
    ...options,
  })
}

export {
  useListItem,
  useListItems,
  useUpdateListItem,
  useRemoveListItem,
  useCreateListItem,
}
