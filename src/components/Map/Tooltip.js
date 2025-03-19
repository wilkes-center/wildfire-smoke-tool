import TooltipBase from '../common/TooltipBase';

/**
 * Standard map tooltip component
 */
const Tooltip = ({ children, content, position = 'top' }) => {
  return (
    <TooltipBase
      content={content}
      position={position}
    >
      {children}
    </TooltipBase>
  );
};

export default Tooltip;