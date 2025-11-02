export const formatDuration = (seconds) => {
  if (!seconds) return "00:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Thêm số 0 đằng trước nếu nhỏ hơn 10
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const displaySeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  return `${displayMinutes}:${displaySeconds}`;
};
// Định dạng tổng số phút từ giây
export const formatTotalMinutes = (totalSeconds) => {
    if (!totalSeconds) return "0 min";
    return `${Math.round(totalSeconds / 60)} min`;
}