import React, { useState } from "react";
import PropTypes from "prop-types";

const ConfirmationModal = ({ isOpen, onClose, onDelete, onUpdate, message, selectedEvent }) => {
    const [title, setTitle] = useState(selectedEvent?.title || ""); // State to manage the input value

  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>{message}</h3>
        <input
          type="text"
          defaultValue={selectedEvent?.title}
          onChange={(event) => {setTitle(event.target.value)}}
        />
        <div style={styles.buttons}>
        <button
            onClick={() => {
                if (selectedEvent) {
                const clonedEvent = {
                    id: selectedEvent.id,
                    title: title
                    };
                  onUpdate(clonedEvent);
                }
              }}
          >
            אישור
          </button>
          <button
            onClick={onDelete}
          >
            מחיקה
          </button>
          <button
            onClick={onClose}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
  buttons: {
    marginTop: "20px",
  },
  confirmButton: {
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
  },
  cancelButton: {
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  selectedEvent: PropTypes.object,
};

export default ConfirmationModal;
