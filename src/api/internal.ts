import axios from 'axios'
import { INTERNAL_API_ADDRESS_URL, INTERNAL_SECRET_API_KEY } from '../constants/config'

const internalAuthHeaders = { headers: { Authorization: INTERNAL_SECRET_API_KEY } }

export const onContainerUpdated = async (id: string) => {
  await axios.get(`${INTERNAL_API_ADDRESS_URL}/container/${id}`, internalAuthHeaders)
}

export const getOrganizationEmployees = async (id: string): Promise<string[]> => {
  return (await axios.get(`${INTERNAL_API_ADDRESS_URL}/organization/${id}/employees`, internalAuthHeaders)).data
}
