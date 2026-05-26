import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN, REGISTRE } from '../graphql/queries'
import Leaderboard from '../components/Leaderboard'

export default function Auth({ onAuth }) {
    const [mode, setMode] = useState('login')
    const [nickname, setNickname] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const [doLogin] = useMutation(LOGIN, {
        onCompleted: (r) => {
            if (r.login?.__typename === 'Token') {
                localStorage.setItem('token', r.login.token)
                localStorage.setItem('uid', r.login.uid)
                setError('')
                onAuth(r.login.uid)
            } else {
                setError(r.login?.missatge || 'Error desconegut')
            }
        },
        onError: (e) => setError(e.message)
    })

    const [doRegistre] = useMutation(REGISTRE, {
        onCompleted: (r) => {
            if (r.registre?.__typename === 'Token') {
                localStorage.setItem('token', r.registre.token)
                localStorage.setItem('uid', r.registre.uid)
                setError('')
                onAuth(r.registre.uid)
            } else {
                setError(r.registre?.missatge || 'Error desconegut')
            }
        },
        onError: (e) => setError(e.message)
    })

    const submit = () => {
        setError('')
        if (!email.trim() || !password.trim()) {
            setError('Omple tots els camps')
            return
        }
        if (mode === 'login') {
            doLogin({ variables: { email: email.trim(), password } })
        } else {
            if (!nickname.trim()) { setError('El nickname es obligatori'); return }
            doRegistre({ variables: { nickname: nickname.trim(), email: email.trim(), password } })
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="text-center" style={{ maxWidth: 420, width: '100%' }}>
                <h1 className="display-4" style={{ fontFamily: 'Cinzel, serif', color: '#c9a227', textShadow: '0 0 30px #c9a22766' }}>
                    IRON GATE
                </h1>
                <p className="mb-4" style={{ color: '#a08c5a', fontStyle: 'italic' }}>
                    {mode === 'login' ? 'Inicia sessio' : 'Crea el teu compte'}
                </p>

                <div className="mb-3">
                    {mode === 'register' && (
                        <input className="form-control mb-2 text-center" placeholder="Nickname"
                            value={nickname} onChange={e => setNickname(e.target.value)} />
                    )}
                    <input className="form-control mb-2 text-center" placeholder="Email"
                        value={email} onChange={e => setEmail(e.target.value)} type="email" />
                    <input className="form-control mb-2 text-center" placeholder="Contrasenya"
                        value={password} onChange={e => setPassword(e.target.value)} type="password" />
                    {error && <p className="text-danger small">{error}</p>}
                    <button className="btn btn-warning w-100" onClick={submit}>
                        {mode === 'login' ? 'ENTRAR' : 'REGISTRAR-SE'}
                    </button>
                </div>

                <p className="small" style={{ color: '#a08c5a', cursor: 'pointer' }}
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
                    {mode === 'login' ? 'No tens compte? Registra\'t' : 'Ja tens compte? Inicia sessio'}
                </p>

                <Leaderboard />
            </div>
        </div>
    )
}
