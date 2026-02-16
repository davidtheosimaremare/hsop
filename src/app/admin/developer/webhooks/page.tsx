"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { processWebhook, getWebhookLogs, processQueueAction, getQueueStatsAction } from "@/app/actions/webhook";
import { format } from "date-fns";

// Example Payloads
// Example Payloads
const EXAMPLES = {
    "ITEM": JSON.stringify([
        {
            "databaseId": 976817,
            "type": "ITEM",
            "timestamp": "12/02/2026 09:40:15",
            "uuid": "2ac44a39-11c0-4431-a31a-a69075aac7f4",
            "data": [
                {
                    "itemId": 3597,
                    "itemNo": "3MT7025-2AA10-0AN2",
                    "action": "WRITE"
                }
            ]
        }
    ], null, 2),
    "ITEM_QUANTITY": JSON.stringify([
        {
            "databaseId": 976817,
            "type": "ITEM_QUANTITY",
            "timestamp": "12/02/2026 12:30:41",
            "uuid": "4a8ce16d-cb3a-4e38-9bec-73fbc743e4b2",
            "data": [
                {
                    "itemId": 34101,
                    "itemNo": "11111111111111",
                    "warehouseId": 100,
                    "warehouseName": "GD. Hokiindo",
                    "quantity": 11
                }
            ]
        }
    ], null, 2),
    "CUSTOMER": JSON.stringify([
        {
            "databaseId": 976817,
            "type": "CUSTOMER",
            "timestamp": "12/02/2026 11:02:08",
            "uuid": "20cc9f00-5845-4665-88b7-4759214bca2a",
            "data": [
                {
                    "customerId": 6950,
                    "customerNo": "C.00141",
                    "action": "WRITE"
                }
            ]
        }
    ], null, 2),
    "SALES_QUOTATION": JSON.stringify({
        "event": "SALES_QUOTATION",
        "action": "INSERT",
        "detail": { "id": 8000, "number": "SQ-2025-001", "customerNo": "CUST-001", "totalAmount": 1000000, "status": "DRAFT" }
    }, null, 2),
    "SALES_ORDER": JSON.stringify({
        "event": "SALES_ORDER",
        "action": "INSERT",
        "detail": { "id": 8001, "number": "SO-2025-0001", "customerNo": "CUST-001", "totalAmount": 1500000, "status": "OPEN" }
    }, null, 2),
    "DELIVERY_ORDER": JSON.stringify({
        "event": "DELIVERY_ORDER",
        "action": "INSERT",
        "detail": { "id": 8002, "number": "DO-2025-001", "customerNo": "CUST-001", "status": "SENT" }
    }, null, 2),
    "SALES_INVOICE": JSON.stringify({
        "event": "SALES_INVOICE",
        "action": "INSERT",
        "detail": { "id": 9001, "number": "SI-2025-0001", "customerNo": "CUST-001", "totalAmount": 1500000, "status": "UNPAID" }
    }, null, 2),
    "SALES_INVOICE_OWING": JSON.stringify({
        "event": "SALES_INVOICE_OWING",
        "action": "INSERT",
        "detail": { "id": 9002, "number": "SI-OWING-001", "totalAmount": 500000 }
    }, null, 2),
    "SALES_RETURN": JSON.stringify({
        "event": "SALES_RETURN",
        "action": "INSERT",
        "detail": { "id": 9003, "number": "SR-2025-001", "customerNo": "CUST-001", "totalAmount": 100000 }
    }, null, 2),
    "SALES_RECEIPT": JSON.stringify({
        "event": "SALES_RECEIPT",
        "action": "INSERT",
        "detail": { "id": 9004, "number": "CR-2025-001", "customerNo": "CUST-001", "paymentAmount": 1500000 }
    }, null, 2),
    "PURCHASE_REQUISITION": JSON.stringify({
        "event": "PURCHASE_REQUISITION",
        "action": "INSERT",
        "detail": { "id": 3001, "number": "PR-2025-001", "description": "Need office supplies" }
    }, null, 2),
    "PURCHASE_ORDER": JSON.stringify({
        "event": "PURCHASE_ORDER",
        "action": "INSERT",
        "detail": { "id": 3002, "number": "PO-2025-001", "vendorNo": "VEND-001", "totalAmount": 5000000 }
    }, null, 2),
    "PURCHASE_INVOICE": JSON.stringify({
        "event": "PURCHASE_INVOICE",
        "action": "INSERT",
        "detail": { "id": 3003, "number": "PI-2025-001", "vendorNo": "VEND-001", "totalAmount": 5000000 }
    }, null, 2),
    "RECEIVE_ITEM": JSON.stringify({
        "event": "RECEIVE_ITEM",
        "action": "INSERT",
        "detail": { "id": 3004, "number": "RI-2025-001", "vendorNo": "VEND-001" }
    }, null, 2),
    "PURCHASE_RETURN": JSON.stringify({
        "event": "PURCHASE_RETURN",
        "action": "INSERT",
        "detail": { "id": 3005, "number": "PRT-2025-001", "vendorNo": "VEND-001" }
    }, null, 2),
    "PURCHASE_PAYMENT": JSON.stringify({
        "event": "PURCHASE_PAYMENT",
        "action": "INSERT",
        "detail": { "id": 3006, "number": "PP-2025-001", "vendorNo": "VEND-001", "paymentAmount": 5000000 }
    }, null, 2),
    "JOB_ORDER": JSON.stringify({
        "event": "JOB_ORDER",
        "action": "INSERT",
        "detail": { "id": 6000, "number": "JO-2025-001" }
    }, null, 2),
    "ROLL_OVER": JSON.stringify({
        "event": "ROLL_OVER",
        "action": "INSERT",
        "detail": { "period": "2025-01" }
    }, null, 2),
    "MATERIAL_ADJUSTMENT": JSON.stringify({
        "event": "MATERIAL_ADJUSTMENT",
        "action": "INSERT",
        "detail": { "id": 6002, "number": "MA-2025-001" }
    }, null, 2),
    "WAREHOUSE": JSON.stringify({
        "event": "WAREHOUSE",
        "action": "INSERT",
        "detail": { "id": 4001, "name": "Gudang Baru" }
    }, null, 2),
    "ITEM_TRANSFER": JSON.stringify({
        "event": "ITEM_TRANSFER",
        "action": "INSERT",
        "detail": { "id": 7002, "number": "IT-2025-001", "fromWarehouse": "Utama", "toWarehouse": "Cabang" }
    }, null, 2),
    "STOCK_MUTATION": JSON.stringify({
        "event": "STOCK_MUTATION",
        "action": "INSERT",
        "detail": { "id": 7001, "number": "SM-2025-0001", "sourceWarehouseName": "Utama", "targetWarehouseName": "Cabang" }
    }, null, 2),
    "ITEM_ADJUSTMENT": JSON.stringify({
        "event": "ITEM_ADJUSTMENT",
        "action": "INSERT",
        "detail": { "id": 6001, "number": "IA-2025-0001", "warehouseName": "Utama" }
    }, null, 2)
};

export default function WebhookSimulator() {
    const [eventType, setEventType] = useState("ITEM");
    const [payload, setPayload] = useState(EXAMPLES["ITEM" as keyof typeof EXAMPLES]);
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({ pendingCount: 0 });
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    useEffect(() => {
        fetchLogs(pagination.page);
        const interval = setInterval(() => fetchLogs(pagination.page), 3000);
        return () => clearInterval(interval);
    }, [pagination.page]);

    const fetchLogs = async (page: number = 1) => {
        const [logsData, statsData] = await Promise.all([
            getWebhookLogs(page),
            getQueueStatsAction()
        ]);
        setLogs(logsData.logs);
        setPagination(logsData.pagination);
        setStats(statsData);
    };

    const handleEventChange = (val: string) => {
        setEventType(val);
        setPayload(EXAMPLES[val as keyof typeof EXAMPLES] || "{}");
    };

    const handleSimulate = async () => {
        setIsLoading(true);
        try {
            const parsed = JSON.parse(payload);
            const result: any = await processWebhook(eventType, parsed);

            if (result.success) {
                toast.success("Webhook Simulated Successfully!");
                fetchLogs(1); // Refresh logs, back to page 1
            } else {
                toast.error("Simulation Failed: " + result.error);
            }
        } catch (error) {
            toast.error("Invalid JSON Payload");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Accurate Webhook Simulator</h1>
                    <p className="text-muted-foreground">
                        Test and debug webhook events without waiting for real transactions.
                    </p>
                    {stats.pendingCount > 0 && (
                        <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            {stats.pendingCount} Webhook dalam antrean
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            setIsRefreshing(true);
                            await processQueueAction();
                            fetchLogs(1);
                            setIsRefreshing(false);
                        }}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Process Queue
                    </Button>
                    <Button variant="outline" onClick={() => fetchLogs(pagination.page)} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simulator Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Simulator</CardTitle>
                        <CardDescription>Select an event type and customize the JSON payload.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Event Type</label>
                            <Select value={eventType} onValueChange={handleEventChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ITEM">ITEM (Create/Update)</SelectItem>
                                    <SelectItem value="ITEM_QUANTITY">ITEM_QUANTITY (Stock Change)</SelectItem>
                                    <SelectItem value="CUSTOMER">CUSTOMER (Create/Update)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">JSON Payload</label>
                            <Textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="font-mono text-xs min-h-[300px]"
                                placeholder="{ ... }"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleSimulate}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Simulating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Webhook
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Logs */}
                <Card className="flex flex-col h-[700px]">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Recent Logs</CardTitle>
                        <CardDescription>History of received webhooks (Total: {pagination.total})</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden flex flex-col gap-4">
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {logs.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No logs found.</p>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border rounded-lg p-3 text-sm space-y-2 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    log.status === "SUCCESS" ? "default" :
                                                        log.status === "ERROR" ? "destructive" :
                                                            "outline"
                                                }>
                                                    {log.status === "SUCCESS" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {log.status === "ERROR" && <XCircle className="w-3 h-3 mr-1" />}
                                                    {log.status === "PENDING" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                                    {log.status === "PROCESSING" && <Loader2 className="w-3 h-3 mr-1 animate-spin text-blue-500" />}
                                                    {log.status}
                                                </Badge>
                                                <span className="font-mono font-bold">{log.event}</span>
                                                {log.retryCount > 0 && (
                                                    <Badge variant="secondary" className="text-[10px]">Retry: {log.retryCount}</Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(log.processedAt), "HH:mm:ss")}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-1 text-[10px] font-mono bg-gray-50 p-1 rounded">
                                            {JSON.stringify(log.payload)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-t pt-4 border-gray-100 flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <CardHeader className="flex-row items-start justify-between border-b relative">
                            <div className="pr-8">
                                <CardTitle>{selectedLog.event}</CardTitle>
                                <CardDescription className="text-[10px] break-all">ID: {selectedLog.id} • {format(new Date(selectedLog.processedAt), "dd/MM/yyyy HH:mm:ss")}</CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 h-8 w-8 rounded-full"
                                onClick={() => setSelectedLog(null)}
                            >
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">Status & Message</label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={selectedLog.status === "SUCCESS" ? "default" : "destructive"}>
                                            {selectedLog.status}
                                        </Badge>
                                        <p className="text-sm">{selectedLog.message || "No process message"}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">Payload</label>
                                    <pre className="bg-gray-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.payload, null, 2)}
                                    </pre>
                                </div>

                                {selectedLog.retryCount > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Retry Info</label>
                                        <p className="text-xs">Count: {selectedLog.retryCount} • Last Retry: {selectedLog.lastRetryAt ? format(new Date(selectedLog.lastRetryAt), "dd/MM/yyyy HH:mm:ss") : "Never"}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
