import { useSEO } from '../hooks/useSEO'
import { Seccion, Aviso, PorDefinir, LegalLayout } from '../components/LegalLayout'

export default function PrivacidadPage() {
  useSEO({
    title: 'Política de privacidad',
    description: 'Cómo Canchas Tandil recopila, usa y protege tus datos personales.',
  })

  return (
    <LegalLayout titulo="Política de privacidad" actualizado="21 de agosto de 2026">
      <Aviso>
        Este documento es un <b>borrador de trabajo</b>. Antes de operar comercialmente conviene que lo revise
        un profesional del derecho.
      </Aviso>

      <Seccion n="1" titulo="Responsable de los datos">
        <p>
          El responsable del tratamiento de los datos personales recopilados en Canchas Tandil es{' '}
          <b>Tomás Cufre</b>, CUIT 20-43867671-7, con domicilio en{' '}
          <PorDefinir>domicilio</PorDefinir>. Para cualquier consulta:{' '}
          <PorDefinir>email de contacto</PorDefinir>.
        </p>
      </Seccion>

      <Seccion n="2" titulo="Qué datos recopilamos">
        <p><b>Datos que nos das al registrarte:</b></p>
        <ul>
          <li>Nombre y apellido</li>
          <li>Correo electrónico</li>
          <li>Número de celular</li>
          <li>Contraseña (almacenada cifrada; nunca la vemos)</li>
          <li>Foto de perfil, si decidís cargarla (opcional)</li>
        </ul>

        <p><b>Datos que se generan al usar la Plataforma:</b></p>
        <ul>
          <li>Tus reservas: cancha, fecha, horario, importe y método de pago elegido</li>
          <li>Las reseñas y puntuaciones que publiques</li>
          <li>Tus canchas favoritas</li>
          <li>El resultado de los partidos, si elegís cargarlo</li>
          <li>Tu ubicación aproximada, <b>solo si autorizás</b> el permiso del navegador para ordenar las canchas por cercanía. No la almacenamos.</li>
        </ul>

        <p><b>Datos de los Establecimientos:</b> nombre del complejo, dirección, precios, fotos y, si activan la seña, los datos de pago que decidan publicar.</p>
      </Seccion>

      <Seccion n="3" titulo="Para qué los usamos">
        <ul>
          <li>Crear y administrar tu cuenta</li>
          <li>Gestionar tus reservas y ponerte en contacto con el Establecimiento</li>
          <li>Mostrar tu nombre y foto junto a las reseñas que publiques</li>
          <li>Elaborar tus estadísticas personales y las del Establecimiento</li>
          <li>Prevenir usos fraudulentos y proteger la seguridad del servicio</li>
        </ul>
        <p>
          <b>No vendemos tus datos</b> ni los cedemos a terceros con fines publicitarios.
        </p>
      </Seccion>

      <Seccion n="4" titulo="Quién puede ver tus datos">
        <ul>
          <li><b>Tu nombre y foto de perfil</b> son visibles públicamente junto a las reseñas que publiques.</li>
          <li><b>Tu teléfono</b> solo puede verlo el Establecimiento en cuya cancha tenés una reserva, para coordinar el turno. No es visible para otros usuarios.</li>
          <li><b>Tu correo electrónico</b> no es visible para otros usuarios ni para los Establecimientos.</li>
          <li><b>Tus reservas</b> solo las ven vos y el Establecimiento correspondiente.</li>
        </ul>
      </Seccion>

      <Seccion n="5" titulo="Dónde se guardan">
        <p>
          Utilizamos servicios de terceros para operar la Plataforma:
        </p>
        <ul>
          <li><b>Supabase</b> — base de datos y autenticación. Los datos se alojan en servidores ubicados en <b>São Paulo, Brasil</b>.</li>
          <li><b>Vercel</b> — alojamiento del sitio y estadísticas de visitas de forma agregada y anónima.</li>
        </ul>
        <p>
          Al utilizar la Plataforma, prestás conformidad para que tus datos sean tratados en dichos servidores,
          conforme a lo previsto por la Ley N.º 25.326 de Protección de los Datos Personales.
        </p>
      </Seccion>

      <Seccion n="6" titulo="Cuánto tiempo los conservamos">
        <p>
          Conservamos tus datos mientras tu cuenta permanezca activa. Si solicitás la baja, los conservamos
          por <b>un (1) año</b> a partir de ese momento, plazo previsto para atender eventuales reclamos
          relacionados con reservas o pagos. Cumplido ese plazo, los datos personales se eliminan. Podemos
          mantener por más tiempo información estadística <b>anonimizada</b>, que no permite identificarte.
        </p>
      </Seccion>

      <Seccion n="7" titulo="Tus derechos">
        <p>
          Como titular de los datos, podés ejercer en cualquier momento tus derechos de <b>acceso,
          rectificación, actualización y supresión</b>. Podés modificar tu nombre, teléfono y foto directamente
          desde <i>Mi perfil</i>, o escribirnos a <PorDefinir>email de contacto</PorDefinir> para solicitar la
          baja de tu cuenta.
        </p>
        <Aviso tono="info">
          La <b>Agencia de Acceso a la Información Pública</b>, órgano de control de la Ley N.º 25.326, tiene
          la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento
          de las normas sobre protección de datos personales.
        </Aviso>
      </Seccion>

      <Seccion n="8" titulo="Almacenamiento en tu navegador">
        <p>
          La Plataforma guarda información en tu dispositivo para que la experiencia funcione correctamente:
          tu sesión iniciada y la preferencia de tema (claro u oscuro). No utilizamos cookies de publicidad ni
          de seguimiento de terceros.
        </p>
      </Seccion>

      <Seccion n="9" titulo="Seguridad">
        <p>
          Aplicamos medidas técnicas para proteger tu información: conexión cifrada (HTTPS), contraseñas
          almacenadas con algoritmos de hash, y reglas de acceso a nivel de base de datos que impiden que un
          usuario acceda a datos de otro. Ningún sistema es completamente infalible, pero trabajamos para
          mantener el resguardo adecuado.
        </p>
      </Seccion>

      <Seccion n="10" titulo="Cambios en esta política">
        <p>
          Podemos actualizar esta política. Los cambios relevantes se informarán dentro de la Plataforma,
          indicando la fecha de la última actualización.
        </p>
      </Seccion>
    </LegalLayout>
  )
}
