export function addCurrencyCommas(currency?: number | string): string | undefined {
	if (currency) {
		return currency.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
}
