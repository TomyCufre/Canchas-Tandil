import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { Seccion, Aviso, PorDefinir, LegalLayout } from '../components/LegalLayout'

export default function TerminosPage() {
  useSEO({
    title: 'Términos y condiciones',
    description: 'Términos y condiciones de uso de Canchas Tandil, la plataforma para reservar canchas de fútbol en Tandil.',
  })

  return (
    <LegalLayout titulo="Términos y condiciones" actualizado="21 de agosto de 2026">
      <Aviso>
        Este documento es un <b>borrador de trabajo</b>. Antes de operar comercialmente conviene que lo revise
        un profesional del derecho.
      </Aviso>

      <Seccion n="1" titulo="Qué es Canchas Tandil">
        <p>
          Canchas Tandil (en adelante, <b>la Plataforma</b>) es un sitio web que permite a los jugadores
          encontrar canchas deportivas en la ciudad de Tandil, provincia de Buenos Aires, y solicitar turnos
          en ellas. La Plataforma es operada por <b>Tomás Cufre</b>, CUIT 20-43867671-7.
        </p>
        <p>
          La Plataforma <b>no es propietaria, administradora ni operadora de las canchas</b> que se publican.
          Su función es exclusivamente poner en contacto a los jugadores con los clubes y complejos deportivos
          (en adelante, <b>los Establecimientos</b>) que ofrecen sus instalaciones.
        </p>
      </Seccion>

      <Seccion n="2" titulo="Aceptación de estos términos">
        <p>
          Al crear una cuenta, reservar un turno o utilizar la Plataforma de cualquier forma, el usuario
          declara haber leído y aceptado estos términos y la{' '}
          <Link to="/privacidad" style={{ color: 'var(--green)', fontWeight: 700 }}>Política de Privacidad</Link>.
          Si no está de acuerdo, debe abstenerse de utilizar el servicio.
        </p>
      </Seccion>

      <Seccion n="3" titulo="Registro y cuenta">
        <ul>
          <li>Para reservar es necesario crear una cuenta con datos <b>veraces, exactos y actualizados</b>, incluyendo un número de celular válido.</li>
          <li>
            El usuario debe tener <b>15 años cumplidos</b> como mínimo. Quienes tengan entre 15 y 18 años
            necesitan la autorización de su madre, padre o tutor, quien será responsable de las reservas
            realizadas y del cumplimiento de estos términos.
          </li>
          <li>La contraseña es personal e intransferible. El usuario es responsable de toda actividad realizada desde su cuenta.</li>
          <li>Está prohibido crear cuentas con datos de terceros o hacerse pasar por otra persona.</li>
          <li>Las cuentas de Establecimiento requieren <b>aprobación previa</b> de la Plataforma antes de poder publicar canchas.</li>
        </ul>
      </Seccion>

      <Seccion n="4" titulo="Cómo funcionan las reservas">
        <ul>
          <li>Al solicitar un turno, este queda en estado <b>pendiente</b>. La reserva se perfecciona cuando el Establecimiento la <b>confirma</b>.</li>
          <li>Un turno pendiente no garantiza la disponibilidad de la cancha hasta su confirmación.</li>
          <li>El Establecimiento puede rechazar una solicitud o cerrar fechas y horarios a su criterio.</li>
          <li>El código de reserva permite identificar el turno ante el Establecimiento.</li>
        </ul>
      </Seccion>

      <Seccion n="5" titulo="Precios, pagos y seña">
        <Aviso tono="info">
          <b>La Plataforma no procesa pagos.</b> El dinero del alquiler nunca pasa por Canchas Tandil.
        </Aviso>
        <ul>
          <li>Los precios son fijados y actualizados por cada Establecimiento. El importe mostrado corresponde al turno completo.</li>
          <li>El pago se realiza <b>directamente al Establecimiento</b>, por los medios que este acepte (efectivo, transferencia u otros).</li>
          <li>Algunos Establecimientos pueden solicitar una <b>seña</b> para asegurar el turno. El monto y la forma de envío los define cada Establecimiento, y es este quien confirma haberla recibido.</li>
          <li>Cualquier reclamo por cobros, devoluciones o diferencias de precio debe dirigirse al Establecimiento.</li>
        </ul>
      </Seccion>

      <Seccion n="6" titulo="Cancelaciones">
        <ul>
          <li>El jugador puede cancelar un turno pendiente desde la sección <i>Mis turnos</i>.</li>
          <li>
            Las condiciones de devolución de la seña y los plazos de aviso los define <b>cada Establecimiento</b>.
            La Plataforma no fija una política común ni interviene en esas decisiones: consultá las condiciones
            del club antes de reservar.
          </li>
          <li>El Establecimiento puede cancelar un turno por causas justificadas (clima, mantenimiento, fuerza mayor), procurando avisar con la mayor antelación posible.</li>
        </ul>
      </Seccion>

      <Seccion n="7" titulo="Obligaciones del jugador">
        <ul>
          <li>Presentarse en el horario reservado y respetar el reglamento interno del Establecimiento.</li>
          <li>Utilizar las instalaciones con cuidado y responder por los daños que ocasione.</li>
          <li>Mantener una conducta respetuosa hacia otros jugadores y el personal del Establecimiento.</li>
          <li>No utilizar la Plataforma con fines ilícitos, fraudulentos o para revender turnos.</li>
        </ul>
      </Seccion>

      <Seccion n="8" titulo="Obligaciones del Establecimiento">
        <ul>
          <li>Publicar información veraz sobre sus canchas: precios, horarios, servicios y ubicación.</li>
          <li>Mantener actualizada la disponibilidad y honrar los turnos que confirme.</li>
          <li>Garantizar que las instalaciones se encuentren en condiciones adecuadas de uso y seguridad.</li>
          <li>Contar con las habilitaciones y seguros que exija la normativa aplicable a su actividad.</li>
        </ul>
      </Seccion>

      <Seccion n="9" titulo="Limitación de responsabilidad">
        <p>
          Dado que la Plataforma actúa únicamente como intermediaria, <b>no se responsabiliza</b> por:
        </p>
        <ul>
          <li>El estado, la seguridad, la habilitación o la calidad de las canchas e instalaciones.</li>
          <li>Lesiones, accidentes, daños personales o pérdida de objetos ocurridos durante el uso de las instalaciones.</li>
          <li>El incumplimiento de cualquiera de las partes respecto del turno acordado.</li>
          <li>Los pagos realizados entre jugador y Establecimiento, incluidas las señas.</li>
          <li>Interrupciones del servicio por causas técnicas ajenas a su control.</li>
        </ul>
        <p>
          La Plataforma procura que la información publicada sea correcta, pero no garantiza su exactitud
          permanente, ya que es cargada por cada Establecimiento.
        </p>
      </Seccion>

      <Seccion n="10" titulo="Reseñas y contenido de los usuarios">
        <ul>
          <li>Solo puede calificar una cancha quien haya tenido un turno en ella.</li>
          <li>El contenido debe basarse en una experiencia real y no incluir insultos, datos personales de terceros ni afirmaciones falsas.</li>
          <li>La Plataforma puede eliminar reseñas que incumplan estas pautas.</li>
          <li>El Establecimiento puede responder públicamente cada reseña.</li>
        </ul>
      </Seccion>

      <Seccion n="11" titulo="Propiedad intelectual">
        <p>
          El nombre, el logotipo, el diseño y el software de Canchas Tandil pertenecen a su titular. Las
          fotografías cargadas por cada Establecimiento son de su propiedad o cuenta con autorización para
          usarlas, y al publicarlas otorga a la Plataforma una licencia para mostrarlas dentro del servicio.
        </p>
      </Seccion>

      <Seccion n="12" titulo="Suspensión de cuentas">
        <p>
          La Plataforma podrá suspender o dar de baja cuentas que incumplan estos términos, registren datos
          falsos, generen reservas fraudulentas o perjudiquen a otros usuarios o Establecimientos.
        </p>
      </Seccion>

      <Seccion n="13" titulo="Modificaciones">
        <p>
          Estos términos pueden actualizarse. Los cambios relevantes se informarán dentro de la Plataforma.
          El uso posterior implica la aceptación de la versión vigente.
        </p>
      </Seccion>

      <Seccion n="14" titulo="Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las
          partes se someten a los tribunales ordinarios de la ciudad de <b>Tandil</b>, provincia de Buenos
          Aires, sin perjuicio de los derechos que la normativa de defensa del consumidor reconozca al usuario.
        </p>
      </Seccion>

      <Seccion n="15" titulo="Contacto">
        <p>
          Por consultas sobre estos términos: <PorDefinir>email de contacto</PorDefinir>
        </p>
      </Seccion>
    </LegalLayout>
  )
}
