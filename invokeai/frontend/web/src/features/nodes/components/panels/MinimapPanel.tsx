import { useColorModeValue } from '@chakra-ui/react';
import { memo } from 'react';
import { MiniMap } from 'reactflow';

const MinimapPanel = () => {
  const miniMapStyle = useColorModeValue(
    {
      background: 'var(--invokeai-colors-base-200)',
    },
    {
      background: 'var(--invokeai-colors-base-500)',
    }
  );

  const nodeColor = useColorModeValue(
    'var(--invokeai-colors-accent-300)',
    'var(--invokeai-colors-accent-700)'
  );

  const maskColor = useColorModeValue(
    'var(--invokeai-colors-blackAlpha-300)',
    'var(--invokeai-colors-blackAlpha-600)'
  );

  return (
    <MiniMap
      nodeStrokeWidth={3}
      pannable
      zoomable
      nodeBorderRadius={30}
      style={miniMapStyle}
      nodeColor={nodeColor}
      maskColor={maskColor}
    />
  );
};

export default memo(MinimapPanel);
