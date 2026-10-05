import { VotingRepository } from '../domain/VotingRepository.js'
import { Voto, VotanteYaVotoError } from '../domain/models.js'
import {
  CandidatoNoHabilitadoError,
  CandidaturaInvalidaError,
  OperacionNoPermitidaError,
  PuestoDuplicadoError,
  PuestoInvalidoError,
  crearCandidatura,
  validarDatosCandidatura,
} from '../domain/administration.js'

export class InMemoryVotingRepository extends VotingRepository {
  constructor(candidatos = [], puestos = []) {
    super()
    this.puestos = puestos
    this.candidaturas = candidatos.map((candidato) => crearCandidatura({
      id: candidato.id,
      nombreCompleto: candidato.nombreCompleto ?? candidato.nombre,
      fotografia: candidato.fotografia ?? candidato.foto,
      presentacion: candidato.presentacion ?? candidato.propuesta,
      puestoId: candidato.puestoId ?? puestos[0]?.id,
      estado: candidato.estado ?? 'Habilitado',
      requisitos: candidato.requisitos ?? (candidato.estado === 'Pendiente'
        ? undefined
        : [
            { nombre: 'Documentación presentada', cumplido: true },
            { nombre: 'Membresía activa', cumplido: true },
            { nombre: 'Sin sanciones vigentes', cumplido: true },
          ]),
    }))
    this.votos = []
    this.votantesQueVotaron = new Set()
    this.jornadaIniciada = false
  }

  obtenerCandidatos() {
    const puestos = new Map(this.puestos.filter((puesto) => puesto.activo).map((puesto) => [puesto.id, puesto]))
    return this.candidaturas
      .filter((candidatura) => candidatura.estado === 'Habilitado' && puestos.has(candidatura.puestoId))
      .map((candidatura) => ({
        ...candidatura,
        agrupacion: puestos.get(candidatura.puestoId).nombre,
      }))
  }

  obtenerCandidaturas() {
    return this.candidaturas
  }

  obtenerPuestos() {
    return this.puestos.filter((puesto) => puesto.activo)
  }

  obtenerJornadaIniciada() {
    return this.jornadaIniciada
  }

  cambiarJornada(iniciada) {
    this.jornadaIniciada = iniciada
  }

  comprobarJornada() {
    if (this.jornadaIniciada) throw new OperacionNoPermitidaError()
  }

  guardarPuesto(datos, id = null) {
    this.comprobarJornada()
    const nombre = datos.nombre?.trim()
    if (!nombre) throw new PuestoInvalidoError()
    const duplicado = this.puestos.some((puesto) =>
      puesto.activo && puesto.id !== id && puesto.nombre.trim().toLocaleLowerCase() === nombre.toLocaleLowerCase())
    if (duplicado) throw new PuestoDuplicadoError()

    if (id) {
      const puesto = this.puestos.find((item) => item.id === id && item.activo)
      if (!puesto) throw new PuestoInvalidoError('El puesto seleccionado ya no existe.')
      puesto.nombre = nombre
      puesto.descripcion = datos.descripcion?.trim() ?? ''
      return puesto
    }

    const puesto = { id: crypto.randomUUID(), nombre, descripcion: datos.descripcion?.trim() ?? '', activo: true }
    this.puestos.push(puesto)
    return puesto
  }

  eliminarPuesto(id) {
    this.comprobarJornada()
    const puesto = this.puestos.find((item) => item.id === id && item.activo)
    if (!puesto) throw new PuestoInvalidoError('El puesto seleccionado ya no existe.')
    this.puestos = this.puestos.filter((item) => item.id !== id)
    this.candidaturas = this.candidaturas.filter((candidatura) => candidatura.puestoId !== id)
  }

  guardarCandidatura(datos, id = null) {
    this.comprobarJornada()
    validarDatosCandidatura(datos)
    if (!this.puestos.some((puesto) => puesto.activo && puesto.id === datos.puestoId)) {
      throw new CandidaturaInvalidaError('El puesto seleccionado no existe.')
    }

    if (!id) {
      const candidatura = crearCandidatura(datos)
      this.candidaturas.push(candidatura)
      return candidatura
    }

    const candidatura = this.obtenerCandidaturaEditable(id)
    candidatura.nombreCompleto = datos.nombreCompleto.trim()
    candidatura.nombre = candidatura.nombreCompleto
    candidatura.fotografia = datos.fotografia ?? candidatura.fotografia
    candidatura.foto = candidatura.fotografia
    candidatura.presentacion = datos.presentacion.trim()
    candidatura.propuesta = candidatura.presentacion
    candidatura.puestoId = datos.puestoId
    return candidatura
  }

  obtenerCandidaturaEditable(id) {
    this.comprobarJornada()
    const candidatura = this.candidaturas.find((item) => item.id === id)
    if (!candidatura || candidatura.estado === 'Retirado') {
      throw new CandidaturaInvalidaError('La candidatura no existe o ya fue retirada.')
    }
    return candidatura
  }

  actualizarRequisito(id, requisitoNombre, cumplido) {
    const candidatura = this.obtenerCandidaturaEditable(id)
    const requisito = candidatura.requisitos.find((item) => item.nombre === requisitoNombre)
    if (!requisito) throw new CandidaturaInvalidaError('El requisito seleccionado no existe.')
    requisito.cumplido = cumplido
    if (!candidatura.requisitos.every((item) => item.cumplido)) candidatura.estado = 'Pendiente'
    return candidatura
  }

  habilitarCandidatura(id) {
    const candidatura = this.obtenerCandidaturaEditable(id)
    const pendientes = candidatura.requisitos.filter((item) => !item.cumplido).map((item) => item.nombre)
    if (pendientes.length) throw new CandidatoNoHabilitadoError(pendientes)
    candidatura.estado = 'Habilitado'
    return candidatura
  }

  retirarCandidatura(id) {
    const candidatura = this.obtenerCandidaturaEditable(id)
    candidatura.estado = 'Retirado'
    return candidatura
  }

  yaVoto(votanteId) {
    return this.votantesQueVotaron.has(votanteId)
  }

  registrarVoto(votanteId, candidatoId) {
    if (this.yaVoto(votanteId)) {
      throw new VotanteYaVotoError()
    }
    this.votos.push(new Voto(candidatoId))
    this.votantesQueVotaron.add(votanteId)
  }

  obtenerResultados() {
    return this.votos.reduce((conteo, voto) => {
      conteo[voto.candidatoId] = (conteo[voto.candidatoId] || 0) + 1
      return conteo
    }, {})
  }
}
