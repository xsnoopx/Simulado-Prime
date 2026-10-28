package com.xsnoopx.simuladoprime;

import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // O app é o site do Simulado Prime carregado dentro de um WebView. Sem este
    // override, o botão "voltar" do Android fecha o app no meio da navegação em
    // vez de voltar uma tela. Só fecha quando não há mais histórico.
    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
