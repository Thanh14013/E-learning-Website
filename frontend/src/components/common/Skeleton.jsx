/**
 * Skeleton Loading Components
 * Placeholder components shown while content is loading
 */

import styles from './Skeleton.module.css';

/**
 * Card Skeleton
 * Used for course cards, discussion cards, etc.
 */
export const CardSkeleton = () => (
    <div className={styles.card}>
        <div className={`${styles.skeleton} ${styles.image}`}></div>
        <div className={styles.cardContent}>
            <div className={`${styles.skeleton} ${styles.title}`}></div>
            <div className={`${styles.skeleton} ${styles.text}`}></div>
            <div className={`${styles.skeleton} ${styles.textShort}`}></div>
        </div>
    </div>
);

/**
 * List Item Skeleton
 * Used for lists, tables, etc.
 */
export const ListItemSkeleton = () => (
    <div className={styles.listItem}>
        <div className={`${styles.skeleton} ${styles.avatar}`}></div>
        <div className={styles.listContent}>
            <div className={`${styles.skeleton} ${styles.text}`}></div>
            <div className={`${styles.skeleton} ${styles.textShort}`}></div>
        </div>
    </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = () => (
    <div className={styles.tableRow}>
        <div className={`${styles.skeleton} ${styles.tableCell}`}></div>
        <div className={`${styles.skeleton} ${styles.tableCell}`}></div>
        <div className={`${styles.skeleton} ${styles.tableCell}`}></div>
        <div className={`${styles.skeleton} ${styles.tableCellShort}`}></div>
    </div>
);

/**
 * Profile Header Skeleton
 */
export const ProfileSkeleton = () => (
    <div className={styles.profile}>
        <div className={`${styles.skeleton} ${styles.avatarLarge}`}></div>
        <div className={styles.profileContent}>
            <div className={`${styles.skeleton} ${styles.titleLarge}`}></div>
            <div className={`${styles.skeleton} ${styles.text}`}></div>
            <div className={`${styles.skeleton} ${styles.textShort}`}></div>
        </div>
    </div>
);

/**
 * Course Detail Skeleton
 */
export const CourseDetailSkeleton = () => (
    <div className={styles.courseDetail}>
        <div className={`${styles.skeleton} ${styles.banner}`}></div>
        <div className={styles.courseInfo}>
            <div className={`${styles.skeleton} ${styles.titleLarge}`}></div>
            <div className={`${styles.skeleton} ${styles.text}`}></div>
            <div className={`${styles.skeleton} ${styles.text}`}></div>
            <div className={styles.metaRow}>
                <div className={`${styles.skeleton} ${styles.chip}`}></div>
                <div className={`${styles.skeleton} ${styles.chip}`}></div>
                <div className={`${styles.skeleton} ${styles.chip}`}></div>
            </div>
        </div>
    </div>
);

/**
 * Grid of Card Skeletons
 */
export const CardGridSkeleton = ({ count = 6 }) => (
    <div className={styles.cardGrid}>
        {Array.from({ length: count }).map((_, index) => (
            <CardSkeleton key={index} />
        ))}
    </div>
);

/**
 * List of List Item Skeletons
 */
export const ListSkeleton = ({ count = 5 }) => (
    <div className={styles.list}>
        {Array.from({ length: count }).map((_, index) => (
            <ListItemSkeleton key={index} />
        ))}
    </div>
);

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 5 }) => (
    <div className={styles.table}>
        {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} />
        ))}
    </div>
);

/**
 * Full Page Loading Skeleton
 */
export const PageSkeleton = () => (
    <div className={styles.page}>
        <div className={`${styles.skeleton} ${styles.titleLarge}`}></div>
        <div className={styles.pageGrid}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
    </div>
);

/**
 * Text Block Skeleton
 */
export const TextBlockSkeleton = ({ lines = 3 }) => (
    <div className={styles.textBlock}>
        {Array.from({ length: lines }).map((_, index) => (
            <div
                key={index}
                className={`${styles.skeleton} ${styles.textLine}`}
                style={{ width: index === lines - 1 ? '70%' : '100%' }}
            ></div>
        ))}
    </div>
);

export default {
    CardSkeleton,
    ListItemSkeleton,
    TableRowSkeleton,
    ProfileSkeleton,
    CourseDetailSkeleton,
    CardGridSkeleton,
    ListSkeleton,
    TableSkeleton,
    PageSkeleton,
    TextBlockSkeleton,
};
