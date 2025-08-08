'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  X,
  Zap,
  AlertCircle,
  CheckCircle,
  RotateCcw
} from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
  title?: string
}

export default function BarcodeScanner({ onScan, onClose, isOpen, title = 'Scanner de Código de Barras' }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador')
      }

      // Solicitar acesso à câmera traseira (preferencial para leitura de códigos)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        
        // Aguardar o vídeo carregar antes de iniciar o scan
        videoRef.current.onloadedmetadata = () => {
          startScanning()
        }
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    setIsScanning(false)
    setError(null)
    setLastScanned(null)
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Configurar o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Simular detecção de código de barras
    // Em uma implementação real, você usaria uma biblioteca como QuaggaJS ou ZXing
    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Desenhar o frame atual no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Simular detecção de código de barras
        // Em uma implementação real, aqui você processaria a imagem
        simulateBarcodeDetection()
      }
    }, 500) // Verificar a cada 500ms
  }

  const simulateBarcodeDetection = () => {
    // Simulação: gerar um código de barras aleatório ocasionalmente
    // Em uma implementação real, isso seria substituído pela biblioteca de detecção
    const shouldDetect = Math.random() < 0.1 // 10% de chance a cada verificação
    
    if (shouldDetect) {
      const mockBarcodes = [
        '7894900011517', // Coca-Cola 2L
        '7891000100103', // Pão de Açúcar
        '7891000053508', // Leite Integral
        '7891000315507', // Arroz Branco
        '7894900010015', // Guaraná Antarctica
        '7891000244005', // Açúcar Cristal
        '7891000100004', // Feijão Preto
        '7894900011234'  // Código genérico
      ]
      
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
      handleBarcodeDetected(randomBarcode)
    }
  }

  const handleBarcodeDetected = (barcode: string) => {
    if (barcode === lastScanned) return // Evitar duplicatas
    
    setLastScanned(barcode)
    
    // Feedback visual/sonoro
    if (navigator.vibrate) {
      navigator.vibrate(200) // Vibração no celular
    }
    
    // Parar o scanning temporariamente
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    // Chamar callback com o código detectado
    onScan(barcode)
    
    // Fechar o scanner após 1 segundo
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  const handleManualInput = () => {
    const barcode = prompt('Digite o código de barras:')
    if (barcode && barcode.trim()) {
      handleBarcodeDetected(barcode.trim())
    }
  }

  const handleRetry = () => {
    setError(null)
    setLastScanned(null)
    startCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={handleManualInput} className="w-full">
                  Digitar Código
                </Button>
              </div>
            </div>
          ) : lastScanned ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-green-600 mb-2">Código detectado!</p>
              <p className="font-mono text-lg font-bold">{lastScanned}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Área do vídeo */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Canvas oculto para processamento */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Overlay de scanning */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-64 h-32 flex items-center justify-center">
                    {isScanning ? (
                      <div className="text-white text-center">
                        <Zap className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm">Posicione o código de barras aqui</p>
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Iniciando câmera...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instruções */}
              <div className="text-center text-sm text-gray-600">
                <p>Posicione o código de barras dentro da área marcada</p>
                <p>A detecção será automática</p>
              </div>

              {/* Botões de ação */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleManualInput}
                  className="w-full"
                >
                  Digitar Código Manualmente
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}