import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import styles from './ApiDocs.module.css';

/**
 * API Documentation Page
 * Displays Swagger UI for complete API documentation
 */
const ApiDocs = () => {
    return (
        <div className={styles.apiDocsContainer}>
            <div className={styles.header}>
                <h1>🎓 E-Learning Platform API Documentation</h1>
                <p className={styles.description}>
                    Complete REST API documentation for all endpoints. Interactive API testing available.
                </p>
                <div className={styles.badges}>
                    <span className={styles.badge}>v1.0.0</span>
                    <span className={styles.badge}>REST API</span>
                    <span className={styles.badge}>JWT Auth</span>
                    <span className={styles.badge}>WebSocket</span>
                </div>
            </div>

            <div className={styles.swaggerWrapper}>
                <SwaggerUI
                    url="/swagger/api-complete.yaml"
                    docExpansion="list"
                    defaultModelsExpandDepth={1}
                    displayRequestDuration={true}
                    filter={true}
                    tryItOutEnabled={true}
                />
            </div>
        </div>
    );
};

export default ApiDocs;
