import { useState } from 'react'
import { Field, FormActions, PageIntro } from '../components/UI'

export default function RoomFormPage({ room, busy, error, onSubmit, onCancel }) {
  const editing = Boolean(room)
  const [roomNumberError, setRoomNumberError] = useState('')
  function submit(event) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('roomNumber')
    if (value === null || value === '' || !Number.isInteger(Number(value)) || Number(value) < 1) {
      setRoomNumberError('Indique um número inteiro igual ou superior a 1.')
      return
    }
    setRoomNumberError('')
    onSubmit(event)
  }
  return <div className="page-stack form-page"><PageIntro kicker={editing ? 'QUARTO' : 'NOVO QUARTO'} title={editing ? 'Atualizar quarto' : 'Preparar novo quarto'} subtitle={editing ? 'Atualize os detalhes deste espaço.' : 'Adicione mais um espaço acolhedor à casa.'} back={onCancel} />
    <form onSubmit={submit} className="surface-card full-page-form" noValidate>
      {error && <div className="alert alert-api" role="alert">{error}</div>}
      <Field label="Número do quarto" error={roomNumberError}><input className={`form-control ${roomNumberError ? 'is-invalid' : ''}`} name="roomNumber" type="number" min="1" step="1" defaultValue={room?.roomNumber} onChange={() => setRoomNumberError('')} /></Field>
      <FormActions busy={busy} submitLabel={editing ? 'Guardar alterações' : 'Adicionar quarto'} onCancel={onCancel} />
    </form>
  </div>
}
