import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8002/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export default client
