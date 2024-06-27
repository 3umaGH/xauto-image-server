import { getOrganizationEmployees } from '../api/internal'

export const bytesToMB = (bytes: number): number => {
  return bytes / (1024 * 1024)
}

export const roundDecimals = (number: number, toDecimals: number) => {
  return parseFloat(number.toFixed(toDecimals))
}

export const isUserUIDInOrganization = async (orgID: string, userUID: string) => {
  const employees = await getOrganizationEmployees(orgID)

  return employees.includes(userUID)
}
