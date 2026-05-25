import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import client from './graphql/client'
import App from './App.jsx'
import 'bootswatch/dist/darkly/bootstrap.min.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>
)