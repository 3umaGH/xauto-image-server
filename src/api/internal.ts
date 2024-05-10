import axios from 'axios'
import { CONTAINER_UPDATE_PING_URL, INTERNAL_SECRET_API_KEY } from '../constants/config'

const internalAuthHeaders = { headers: { Authorization: INTERNAL_SECRET_API_KEY } }

export const onContainerUpdated = async (id: string) => {
  await axios.get(`${CONTAINER_UPDATE_PING_URL}/container/${id}`, internalAuthHeaders)
}
