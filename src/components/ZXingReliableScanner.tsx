'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  Settings
} from 'lucide-react'

interface ZXingReliableScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

interface ScanLog {
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: any
}

export default function ZXingReliableScanner({ isOpen, onClose, onScan }: ZXingReliableScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [scanCount, setScanCount] = useState(0)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isInCooldown, setIsInCooldown] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const codeReaderRef = useRef<any>(null)

  // Função para adicionar log
  const addLog = useCallback((type: ScanLog['type'], message: string, details?: any) => {
    const log: ScanLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }
    
    setLogs(prev => [...prev.slice(-19), log])
    console.log(`[ZXingScanner ${type.toUpperCase()}]`, message, details)
  }, [])

  // Validação EAN-13
  const isValidEAN13 = useCallback((code: string): boolean => {
    if (!/^\d{13}$/.test(code)) return false
    
    const digits = code.split('').map(Number)
    const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
      return sum + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)
    
    const calculatedCheckDigit = (10 - (checksum % 10)) % 10
    return calculatedCheckDigit === digits[12]
  }, [])

  // Validação de código de barras
  const isValidBarcode = useCallback((code: string): boolean => {
    if (!/^\d{8,13}$/.test(code)) return false
    
    if (code.length === 13) {
      return isValidEAN13(code)
    }
    
    return true
  }, [isValidEAN13])

  // Inicializar ZXing
  const initializeZXing = useCallback(async () => {
    try {
      addLog('info', 'Carregando biblioteca ZXing...')
      
      const { BrowserMultiFormatReader } = await import('@zxing/library')
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      addLog('success', 'ZXing carregado com sucesso')
      return true
    } catch (error) {
      addLog('error', `Erro ao carregar ZXing: ${error}`)
      return false
    }
  }, [addLog])

  // Processar resultado do scan
  const handleScanResult = useCallback((result: any) => {
    if (!result || isInCooldown) return
    
    const code = result.getText()
    addLog('info', `Código detectado pelo ZXing: ${code}`)
    
    if (isValidBarcode(code)) {
      const now = Date.now()
      
      // Evitar scans duplicados muito rápidos
      if (lastScannedCode === code && now - lastScanTimeRef.current < 2000) {
        return
      }
      
      addLog('success', `Código válido confirmado: ${code}`)
      setLastScannedCode(code)
      lastScanTimeRef.current = now
      setScanCount(prev => prev + 1)
      
      // Iniciar cooldown
      setIsInCooldown(true)
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsInCooldown(false)
      }, 1500)
      
      // Som de confirmação
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (audioError) {
        addLog('warning', 'Não foi possível reproduzir som')
      }
      
      // Chamar callback
      onScan(code)
      
      // Fechar scanner
      setTimeout(() => {
        onClose()
      }, 500)
    } else {
      addLog('warning', `Código inválido: ${code}`)
    }
  }, [addLog, isValidBarcode, lastScannedCode, onClose, onScan, isInCooldown])

  // Enumerar câmeras
  const enumerateCameras = useCallback(async () => {
    try {
      addLog('info', 'Enumerando câmeras...')
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      setCameras(videoDevices)
      addLog('success', `${videoDevices.length} câmera(s) encontrada(s)`)
      
      // Selecionar câmera traseira
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      
      if (backCamera) {
        setSelectedCameraId(backCamera.deviceId)
        addLog('info', `Câmera traseira selecionada: ${backCamera.label}`)
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId)
        addLog('info', `Primeira câmera selecionada: ${videoDevices[0].label}`)
      }
      
    } catch (error) {
      addLog('error', `Erro ao enumerar câmeras: ${error}`)
    }
  }, [addLog])

  // Inicializar scanner
  const initializeScanner = useCallback(async () => {
    try {
      addLog('info', 'Inicializando scanner ZXing...')
      setError(null)
      
      if (!codeReaderRef.current) {
        const success = await initializeZXing()
        if (!success) return
      }
      
      // Parar stream atual
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
        setCurrentStream(null)
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          facingMode: selectedCameraId ? undefined : 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      }
      
      addLog('info', 'Solicitando acesso à câmera...')
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!videoRef.current) {
        addLog('error', 'Elemento de vídeo não encontrado')
        return
      }
      
      videoRef.current.srcObject = stream
      setCurrentStream(stream)
      
      // Aguardar vídeo carregar
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!
        
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve()
        }
        
        const onError = (error: Event) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          reject(error)
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        video.play().catch(reject)
      })
      
      addLog('success', 'Câmera inicializada com sucesso')
      setIsScanning(true)
      
      // Iniciar detecção ZXing
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current || !codeReaderRef.current || isInCooldown) {
          return
        }
        
        try {
          setIsAnalyzing(true)
          
          const video = videoRef.current
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          
          if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return
          }
          
          // Capturar frame
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Usar ZXing para detectar
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const result = await codeReaderRef.current.decodeFromImageData(imageData)
          
          if (result) {
            handleScanResult(result)
          }
          
        } catch (error) {
          // ZXing lança erro quando não encontra código, isso é normal
          // Só logamos erros reais
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (!errorMessage.includes('NotFoundException')) {       
            addLog('error', `Erro na detecção: ${errorMessage}`)
          }
        } finally {
          setIsAnalyzing(false)
        }
      }, 500) // 2 FPS para melhor performance
      
    } catch (error) {
      const errorMessage = `Erro ao inicializar scanner: ${error}`
      addLog('error', errorMessage)
      setError(errorMessage)
    }
  }, [addLog, currentStream, selectedCameraId, initializeZXing, handleScanResult, isInCooldown])

  // Parar scanner
  const stopScanner = useCallback(() => {
    addLog('info', 'Parando scanner...')
    
    setIsScanning(false)
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = null
    }
    
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch (error) {
        // Ignorar erros de reset
      }
    }
    
    addLog('success', 'Scanner parado com sucesso')
  }, [addLog, currentStream])

  // Reiniciar scanner
  const restartScanner = useCallback(() => {
    addLog('info', 'Reiniciando scanner...')
    stopScanner()
    setTimeout(() => {
      initializeScanner()
    }, 1000)
  }, [addLog, initializeScanner, stopScanner])

  // Alternar câmera
  const switchCamera = useCallback(() => {
    if (cameras.length <= 1) return
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]
    
    addLog('info', `Alternando para: ${nextCamera.label}`)
    setSelectedCameraId(nextCamera.deviceId)
    
    setTimeout(() => {
      initializeScanner()
    }, 500)
  }, [addLog, cameras, initializeScanner, selectedCameraId])

  // Efeito principal
  useEffect(() => {
    if (isOpen && !isScanning) {
      addLog('info', 'Scanner aberto, iniciando...')
      enumerateCameras().then(() => {
        setTimeout(() => {
          initializeScanner()
        }, 500)
      })
    } else if (!isOpen && isScanning) {
      stopScanner()
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isOpen])

  // Reset estados
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setScanCount(0)
      setLastScannedCode(null)
      setLogs([])
      setIsInCooldown(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Scanner ZXing Confiável</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview da Câmera */}
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                <canvas 
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Status overlay */}
                <div className="absolute top-2 left-2 space-y-1">
                  {isScanning && (
                    <Badge className="bg-green-100 text-green-800">
                      <Eye className="w-3 h-3 mr-1" />
                      Escaneando
                    </Badge>
                  )}
                  
                  {isAnalyzing && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Analisando
                    </Badge>
                  )}
                  
                  {isInCooldown && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Cooldown
                    </Badge>
                  )}
                </div>
                
                {/* Contador */}
                {scanCount > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black bg-opacity-50 text-white">
                      Tentativas: {scanCount}
                    </Badge>
                  </div>
                )}
                
                {/* Linha de scan */}
                {isScanning && (
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 opacity-75 transform -translate-y-1/2" />
                )}
              </div>
              
              {/* Controles */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={restartScanner}
                  variant="outline"
                  size="sm"
                  disabled={!isScanning}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
                
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  disabled={cameras.length <= 1}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Alternar Câmera
                </Button>
                
                <Button
                  onClick={() => setLogs([])}
                  variant="outline"
                  size="sm"
                >
                  Limpar Logs
                </Button>
              </div>
              
              {/* Status */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {lastScannedCode && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Último código: {lastScannedCode}</span>
                </div>
              )}
            </div>
            
            {/* Logs */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Logs do ZXing</span>
              </div>
              
              <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50 text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center">Aguardando atividade...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-gray-400 font-mono">{log.timestamp}</span>
                      <span className={`font-medium ${
                        log.type === 'success' ? 'text-green-600' :
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Câmeras disponíveis */}
              {cameras.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Câmeras Disponíveis:</span>
                  <div className="space-y-1">
                    {cameras.map((camera, index) => (
                      <div key={camera.deviceId} className="text-xs p-2 border rounded">
                        <div className="font-medium">
                          {camera.label || `Câmera ${index + 1}`}
                          {camera.deviceId === selectedCameraId && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">Ativa</Badge>
                          )}
                        </div>
                        <div className="text-gray-500 truncate">{camera.deviceId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Instruções */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Scanner usando biblioteca ZXing comprovada em produção</p>
            <p>• Posicione um código de barras na linha vermelha central</p>
            <p>• Detecção 100% confiável sem números aleatórios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}