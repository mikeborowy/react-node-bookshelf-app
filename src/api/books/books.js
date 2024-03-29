import * as React from 'react'
import {useQuery, queryCache} from 'react-query'
import {useApiClient} from 'context/auth-context/auth-context'
import bookPlaceholderSvg from 'assets/book-placeholder.svg'

const loadingBook = {
  title: 'Loading...',
  author: 'loading...',
  coverImageUrl: bookPlaceholderSvg,
  publisher: 'Loading Publishing',
  synopsis: 'Loading...',
  loadingBook: true,
}

const loadingBooks = Array.from({length: 10}, (v, index) => ({
  id: `loading-book-${index}`,
  ...loadingBook,
}))

const bookQueryConfig = {
  staleTime: 1000 * 60 * 60,
  cacheTime: 1000 * 60 * 60,
}

const getBookSearchConfig = (client, query) => ({
  queryKey: ['bookSearch', {query}],
  queryFn: () =>
    client(`books?query=${encodeURIComponent(query)}`).then(data => data.books),
  config: {
    onSuccess(books) {
      for (const book of books) {
        queryCache.setQueryData(
          ['book', {bookId: book.id}],
          book,
          bookQueryConfig,
        )
      }
    },
  },
})

function useBookSearch(query) {
  const client = useApiClient()
  const result = useQuery(getBookSearchConfig(client, query))
  return {...result, books: result.data ?? loadingBooks}
}

function useBook(bookId) {
  const client = useApiClient()
  const {data} = useQuery({
    queryKey: ['book', {bookId}],
    queryFn: () => client(`books/${bookId}`).then(data => data.book),
    ...bookQueryConfig,
  })
  return data ?? loadingBook
}

function useRefetchBookSearchQuery() {
  const client = useApiClient()
  return React.useCallback(
    async function refetchBookSearchQuery() {
      queryCache.removeQueries('bookSearch')
      await queryCache.prefetchQuery(getBookSearchConfig(client, ''))
    },
    [client],
  )
}

function setQueryDataForBook(book) {
  queryCache.setQueryData(['book', {bookId: book.id}], book, bookQueryConfig)
}

export {useBook, useBookSearch, useRefetchBookSearchQuery, setQueryDataForBook}
