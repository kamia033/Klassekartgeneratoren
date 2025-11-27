import React from 'react';

interface StorageErrorModalProps {
    onClear: () => void;
}

const StorageErrorModal: React.FC<StorageErrorModalProps> = ({ onClear }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0, color: '#d32f2f' }}>Oops! Noe gikk galt</h2>
                <p>
                    Nettsiden klarte ikke å laste inn lagret data. Dette skyldes mest sannsynlig oppgraderingen til <strong>Klassekartgeneratoren 2</strong>, 
                    hvor formatet på lagret data har endret seg.
                </p>
                <p>
                    For å fikse dette må du dessverre slette den gamle dataen din.
                </p>
                <button 
                    onClick={onClear}
                    style={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    Slett data og start på nytt
                </button>
            </div>
        </div>
    );
};

export default StorageErrorModal;
