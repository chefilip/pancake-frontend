import { memo } from 'react'
import styled from 'styled-components'
import { Table, Td } from '@pancakeswap/uikit'
import Navigation from 'components/TableNavigation'
import CompactRow from './CompactRow'
import NoOrderTable from './NoOrderTable'
import LoadingTable from './LoadingTable'

const RowStyle = styled.tr`
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundDisabled};
  }
`

const CompactLimitOrderTable = ({ orders }) => {
  if (!orders) return <LoadingTable />

  if (!orders?.length) {
    return <NoOrderTable />
  }

  return (
    <Navigation data={orders}>
      {({ paginatedData }) => (
        <Table>
          <tbody>
            {paginatedData.map((order) => (
              <RowStyle key={order.id}>
                <Td>
                  <CompactRow order={order} />
                </Td>
              </RowStyle>
            ))}
          </tbody>
        </Table>
      )}
    </Navigation>
  )
}

export default memo(CompactLimitOrderTable)
