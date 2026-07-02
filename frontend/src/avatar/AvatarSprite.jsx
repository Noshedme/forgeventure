import { getFramePath } from './SpriteMap';

// Tamaño en px del cuadrado que muestra el sprite.
// Cambia solo este valor para escalar el widget entero.
const SPRITE_SIZE = 160;

export default function AvatarSprite({ state, frame, onClick, skin = 'default' }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:  SPRITE_SIZE,
        height: SPRITE_SIZE,
        cursor: 'pointer',
        userSelect: 'none',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        transition: 'transform 0.15s ease',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      title="Haz clic para abrir el chat"
    >
      <img
        src={getFramePath(state, frame, skin)}
        alt={`Flex - ${state}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'bottom center',
          /* Escala limpia para pixel art de baja resolución */
          imageRendering: 'pixelated',
        }}
        draggable={false}
      />
    </div>
  );
}
