// Notification Service with SSE for real-time order updates
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class NotificationService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnected = false;
    this.audioContext = null;
    this.notificationSound = null;
    this.isDisconnecting = false; // Flag to prevent connection during disconnect
    this.connectionTimeout = null; // Timeout for delayed reconnection
  }

  // Initialize audio for notification sound
  initAudio() {
    if (!this.audioContext) {
      try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        // Create notification sound (beep)
        this.notificationSound = new Audio();
        // Using a simple beep sound data URL
        this.notificationSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWM0fPTgjMGHm7A7+OZRQ0PVqzn7a5aFwhHouHzu2ofBzGHzfPXhzQHIm+98N6WQw0PV6zn7a1aGAdInODzu2seBzGHzfPXhzUHI27A7+OZRQ4OV6zn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRQ0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0OVqzn7axaGQdIm9/zu2wfBzKHzfPXhjUGI27A7+OZRA0O';
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }

  // Play notification sound
  playNotificationSound() {
    this.initAudio();
    
    try {
      if (this.notificationSound) {
        // Clone and play to allow multiple simultaneous sounds
        const sound = this.notificationSound.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(err => console.warn('Could not play notification sound:', err));
      }
      
      // Also try to play system beep
      if (this.audioContext) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Connect to SSE endpoint
  connect(vendorId) {
    // Clear any pending connection timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Don't connect if we're in the process of disconnecting
    if (this.isDisconnecting) {
      console.log('⏳ Waiting for disconnect to complete before reconnecting');
      this.connectionTimeout = setTimeout(() => {
        this.isDisconnecting = false;
        this.connect(vendorId);
      }, 500);
      return;
    }

    // If already connected and working, don't reconnect
    if (this.eventSource && this.isConnected && this.eventSource.readyState === EventSource.OPEN) {
      console.log('✅ SSE already connected, skipping reconnection');
      return;
    }

    // If there's an existing connection but not connected, disconnect it first
    if (this.eventSource) {
      console.log('🔄 Closing existing SSE connection before reconnecting');
      this.disconnect();
      
      // Wait a bit before reconnecting to avoid race conditions
      this.connectionTimeout = setTimeout(() => {
        this.connect(vendorId);
      }, 500);
      return;
    }

    const token = localStorage.getItem('vendor_token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      // Create SSE connection with token in URL
      const url = `${API_BASE_URL}/vendor/orders/stream?token=${encodeURIComponent(token)}`;
      console.log('🔌 Attempting to connect to SSE:', url.replace(/token=[^&]+/, 'token=***'));
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('✅ SSE Connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connected', { status: 'connected' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE Message received:', data);
          
          if (data.type === 'heartbeat') {
            // Ignore heartbeat messages
            return;
          }
          
          // Notify all listeners
          this.notifyListeners('message', data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      // Handle specific event types
      this.eventSource.addEventListener('new_order', (event) => {
        try {
          const order = JSON.parse(event.data);
          console.log('🆕 New order received:', order);
          
          // Play notification sound
          this.playNotificationSound();
          
          // Notify listeners
          this.notifyListeners('new_order', order);
          
          // Show browser notification if permitted
          this.showBrowserNotification('New Order Received!', {
            body: `Order #${order.orderNumber || order._id} - ₹${order.totalAmount}`,
            icon: '/logo.png',
            tag: order._id
          });
        } catch (error) {
          console.error('Error handling new order:', error);
        }
      });

      this.eventSource.addEventListener('order_updated', (event) => {
        try {
          const order = JSON.parse(event.data);
          console.log('🔄 Order updated:', order);
          this.notifyListeners('order_updated', order);
        } catch (error) {
          console.error('Error handling order update:', error);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE Connection error:', error);
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.notifyListeners('error', { error: 'Connection error' });
        
        // Only attempt reconnect if we were previously connected (not on initial connection failure)
        // This prevents reconnection loops on auth failures or CORS issues
        if (wasConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          setTimeout(() => {
            this.connect(vendorId);
          }, this.reconnectDelay * this.reconnectAttempts);
        } else if (!wasConnected && this.eventSource.readyState === EventSource.CLOSED) {
          // Connection failed on first attempt - likely auth or CORS issue
          console.error('❌ Initial SSE connection failed. Check authentication and CORS settings.');
          this.disconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.disconnect();
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
    }
  }

  // Disconnect from SSE
  disconnect() {
    // Clear any pending connection timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.eventSource) {
      this.isDisconnecting = true;
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('SSE Connection closed');
      this.notifyListeners('disconnected', { status: 'disconnected' });
      
      // Reset flag after a short delay
      setTimeout(() => {
        this.isDisconnecting = false;
      }, 100);
    }
  }

  // Add event listener
  addListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    
    return () => this.removeListener(eventType, callback);
  }

  // Remove event listener
  removeListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // Notify all listeners for an event type
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Show browser notification
  async showBrowserNotification(title, options = {}) {
    // Request permission if needed
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification(title, {
            ...options,
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            requireInteraction: true
          });
          
          // Auto close after 10 seconds
          setTimeout(() => notification.close(), 10000);
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.warn('Could not show browser notification:', error);
        }
      }
    }
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
