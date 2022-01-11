import './asset/style/ResetPopup.scss';

const ResetPopup = ({
  show,
  host,
  close,
  reset,
}) => {
  if (show) {
    return (
      <div className="popup-overlay">
        <div
          className="close-background"
          onClick={close}
        />
        <div className="popup-container">
          <div className="p-header">
            Reset Host?
          </div>
          <div className="p-body">
            Hold up! You're about to remove DJ Delta from&nbsp;
            {host.display_name}'s DJ Booth.
            <br/>
            Are you sure you want to do that?
          </div>
          <div className="p-button-container">
            <button
              className="p-button"
              onClick={close}
            >
              NO
            </button>
            <button
              className="p-button"
              onClick={reset}
            >
              YES
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default ResetPopup;
