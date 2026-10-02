import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { api } from './client'
import { employeeService } from './services'

jest.mock('./client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('employeeService.getEmployees', () => {
  beforeEach(() => {
    jest.mocked(api.get).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 10 },
    } as never)
  })

  it('omits empty optional filters from the request', async () => {
    await employeeService.getEmployees({
      search: '',
      department: '',
      status: '',
      page: 1,
      limit: 10,
    })

    expect(api.get).toHaveBeenCalledWith('/api/employees', {
      params: { page: 1, limit: 10 },
    })
  })
})