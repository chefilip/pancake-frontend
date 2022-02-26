import { useState, useMemo, useCallback, ReactElement } from 'react'
import { Text, ArrowBackIcon, ArrowForwardIcon } from '@pancakeswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'

export const PageButtons = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.2em;
  margin-bottom: 1.2em;
`

export const Arrow = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  padding: 0 20px;
  :hover {
    cursor: pointer;
  }
`

interface ExposedProps {
  paginatedData: any[]
}

interface TableNavigationProps {
  data: any[]
  itemsPerPage?: number
  children: (exposedProps: ExposedProps) => ReactElement
}

const ORDERS_PER_PAGE = 5

const TableNavigation: React.FC<TableNavigationProps> = ({ data, itemsPerPage = ORDERS_PER_PAGE, children }) => {
  const { t } = useTranslation()
  const [currentPage, setPage] = useState(1)

  const total = Array.isArray(data) ? data.length : 0

  const maxPage = useMemo(() => {
    if (total) {
      return Math.ceil(total / itemsPerPage)
    }
    return 1
  }, [total, itemsPerPage])

  const onPageNext = useCallback(() => {
    setPage((page) => (page === maxPage ? page : page + 1))
  }, [maxPage])

  const onPagePrev = useCallback(() => {
    setPage((page) => (page === 1 ? page : page - 1))
  }, [])

  const from = useMemo(() => itemsPerPage * (currentPage - 1), [currentPage, itemsPerPage])
  const to = useMemo(() => itemsPerPage * currentPage, [currentPage, itemsPerPage])

  const paginatedData = useMemo(() => {
    return Array.isArray(data) ? data.slice(from, to) : []
  }, [data, from, to])

  return (
    <>
      {children({
        paginatedData,
      })}
      <PageButtons>
        <Arrow onClick={onPagePrev}>
          <ArrowBackIcon color={currentPage === 1 ? 'textDisabled' : 'primary'} />
        </Arrow>

        <Text>{t('Page %page% of %maxPage%', { page: currentPage, maxPage })}</Text>

        <Arrow onClick={onPageNext}>
          <ArrowForwardIcon color={currentPage === maxPage ? 'textDisabled' : 'primary'} />
        </Arrow>
      </PageButtons>
    </>
  )
}

export default TableNavigation
