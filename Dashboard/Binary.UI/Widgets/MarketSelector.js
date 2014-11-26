﻿/// <reference path="../../../Dashboard/Ext.Dashboard/Scripts/ext-all-debug-w-comments.js" />
/// <reference path="../Scripts/Binary/Binary.Api.Client.js" />

Binary = Binary || {};

Binary.MarketSelectorClass = function (el)
{
	var marketStore = Ext.create('Ext.data.Store',
	{
		fields: ['market', 'display_name']
	});

	var symbolStore = Ext.create('Ext.data.Store',
	{
		fields: ['market', 'symbol', 'display_name']
	});

	Binary.Markets = {};
	var selectorContainer = null;
	var marketSelector = null;
	var symbolSelector = null;

	Binary.Api.Client.markets(function (data)
	{
		var marketsCount = data.markets.length;
		for (var i = 0; i < data.markets.length; i++)
		{
			var market = data.markets[i];
			marketStore.add(
			{
				display_name: market.charAt(0).toUpperCase() + market.substr(1),
				market: market
			});
			Binary.Api.Client.markets.market(function (marketData, eventData)
			{
				Binary.Markets[eventData.market] = marketData.symbols;
				for (var s = 0; s < marketData.symbols.length; s++)
				{
					var symbolDetails = marketData.symbols[s];
					symbolStore.add(
					{
						market: eventData.market,
						symbol: symbolDetails.symbol,
						display_name: symbolDetails.display_name
					});
				};
				marketsCount--;
				if (marketsCount == 0)
				{
					Binary.Mediator.fireEvent('marketsAvailable', Binary.Markets);
					selectorContainer = new Ext.container.Container(
					{
						renderTo: el,
						width: '100%',
						layout: 'column',
						defaults:
						{
							columnWidth: 1 / 2,
							selectFirst: function (field, value)
							{
								if (field && value)
								{
									this.store.clearFilter();
									this.store.filter(field, value);
								}
								if (this.store.getCount() > 0)
								{
									this.setValue(this.store.getAt(0).get(this.valueField));
								}
								else
								{
									this.setValue(null);
								}
							}
						},
						listeners:
						{
							afterrender: function ()
							{
								marketSelector.selectFirst();
							}
						},
						items:
						[
							marketSelector = Ext.create('Ext.form.field.ComboBox',
							{
								valueField: 'market',
								displayField: 'display_name',
								store: marketStore,
								queryMode: 'local',
								editable: false,
								listeners:
								{
									change: function (combo, value)
									{
										Binary.Mediator.fireEvent('marketChanged', value);
										symbolSelector.selectFirst('market', value);
									}
								}
							}),
							symbolSelector = Ext.create('Ext.form.field.ComboBox',
							{
								valueField: 'symbol',
								displayField: 'display_name',
								store: symbolStore,
								editable: false,
								queryMode: 'local',
								listeners:
								{
									change: function (combo, value)
									{
										Binary.Mediator.fireEvent('symbolChanged',
										{
											symbolDetails: combo.valueModels[0].data,
											marketDetails: marketStore.findRecord('market', combo.valueModels[0].data.market).data
										});
									}
								}
							})
						]
					});
				}
			},
			market,
			{ market: market });
		}
	});
}
